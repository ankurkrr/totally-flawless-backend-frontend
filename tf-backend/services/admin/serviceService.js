const db = require('../../connection/knexdatabase');
const upload = require('../../utils/fileUpload');
const { uploadFileToS3, deleteFileFromS3 } = require('../../connection/s3ServiceImg');

module.exports.getAllService = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const perPage = parseInt(req.query.perPage) || 10;
        const offset = (page - 1) * perPage;
        const categoryId = req.query.categoryId;
        const service_name = req.query.service_name ? req.query.service_name.trim().toLowerCase() : "";

        if (!categoryId) {
            return res.status(400).json({ message: "categoryId is required." });
        }

        let query = db("services")
            .where("categoryId", categoryId);

        if (service_name) {
            query = query.andWhere("name", "like", `%${service_name}%`);
        }

        const services = await query
            .select("*")
            .limit(perPage)
            .offset(offset);

        if (!services.length) {
            return res.status(404).json({ message: "No services found for the given category." });
        }

        const totalService = await db("services")
            .where("categoryId", categoryId)
            .modify((qb) => {
                if (service_name) {
                    qb.andWhere("name", "like", `%${service_name}%`);
                }
            })
            .count("id as count")
            .first();

        const allServiceCategories = await db("subcategories")
            .whereIn("serviceId", services.map((s) => s.id))
            .select("id", "name", "imgUrl", "serviceId");

        const serviceCategoriesMap = new Map();
        allServiceCategories.forEach(({ id, name, imgUrl, serviceId }) => {
            const normalizedKey = `${serviceId}-${name.toLowerCase().trim()}`;

            if (!serviceCategoriesMap.has(normalizedKey)) {
                serviceCategoriesMap.set(normalizedKey, {
                    id,
                    name,
                    serviceid: serviceId,
                    imgUrls: [],
                });
            }

            serviceCategoriesMap.get(normalizedKey).imgUrls.push(imgUrl);
        });

        const groupedServiceCategories = Array.from(serviceCategoriesMap.values());

        const totalServiceCategories = await db("subcategories")
            .whereIn("serviceId", services.map((s) => s.id))
            .countDistinct("name as count")
            .first();

        // Fetch pricing details
        const pricingData = await db("priceforservices")
            .whereIn("serviceId", services.map((s) => s.id))
            .select("*");

        const servicesWithDetails = services.map((service) => ({
            ...service,
            pricing: pricingData.filter((p) => p.serviceId === service.id),
            servicecategories: groupedServiceCategories.filter((c) => c.serviceid === service.id),
        }));

        res.status(200).json({
            message: "Services fetched successfully.",
            services: servicesWithDetails,
            totalService: totalService.count,
            totalServiceCategories: totalServiceCategories.count,
            pagination: {
                currentPage: page,
                perPage: perPage,
                totalService: totalService.count,
                totalPages: Math.ceil(totalService.count / perPage),
            },
        });
    } catch (err) {
        console.error("Error fetching services:", err);
        res.status(500).json({ message: "Internal server error." });
    }
};

module.exports.getServiceById = async (req, res) => {
    try {
        const { id } = req.params;

        const service = await db('services')
            .where('id', id)
            .first();

        if (!service) {
            return res.status(404).json({
                message: "No service found with the provided ID.",
            });
        }

        const pricing = await db('priceforservices')
            .where('serviceId', id)
            .select('*');

        const categories = await db('subcategories')
            .where('serviceId', id)
            .select('id', 'name', 'title', 'imgUrl', 'serviceId');

        const serviceWithDetails = {
            ...service,
            pricing,
            categories,
        };

        res.status(200).json({
            message: "Service fetched successfully.",
            service: serviceWithDetails,
        });
    } catch (err) {
        console.error("Error fetching service by ID:", err);
        res.status(500).json({
            message: "Internal server error.",
        });
    }
};

module.exports.getServiceByCategoryid = async (req, res) => {
    try {
        const { id } = req.params;
        let { page, limit } = req.query;

        page = parseInt(page) || 1;
        limit = parseInt(limit) || 10;
        const offset = (page - 1) * limit;

        const totalServices = await db('services')
            .where('categoryId', id)
            .count('* as count');

        const totalCount = totalServices[0].count;

        if (totalCount === 0) {
            return res.status(404).json({
                message: "No services found for the provided category ID.",
                total: 0,
                services: [],
            });
        }

        const services = await db('services')
            .where('categoryId', id)
            .select('*')
            .limit(limit)
            .offset(offset);

        const serviceIds = services.map(service => service.id);

        const pricing = await db('priceforservices')
            .whereIn('serviceId', serviceIds)
            .select('*');

        const subcategories = await db('subcategories')
            .whereIn('serviceId', serviceIds)
            .select('id', 'name', 'title', 'imgUrl', 'serviceId');

        const servicesWithDetails = services.map(service => ({
            ...service,
            pricing: pricing.filter(p => p.serviceId === service.id),
            subcategories: subcategories.filter(s => s.serviceId === service.id),
        }));

        res.status(200).json({
            message: "Services fetched successfully.",
            total: totalCount,
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
            services: servicesWithDetails,
        });
    } catch (err) {
        console.error("Error fetching services by categoryId:", err);
        res.status(500).json({
            message: "Internal server error.",
        });
    }
};

module.exports.createOrUpdateService = async (req) => {
    return new Promise(async (resolve, reject) => {
        try {
            const { name, categoryId, pricing, serviceId, actionType } = req.body;

            if (!actionType || (actionType !== "create" && actionType !== "update")) {
                return reject({ message: "Invalid actionType. Use 'create' or 'update'." });
            }

            if (!name || !categoryId || !pricing) {
                return reject({ message: "Missing required fields: name, categoryId, or pricing." });
            }

            let parsedPricing;
            try {
                parsedPricing = JSON.parse(pricing);
            } catch (error) {
                return reject({ message: "Invalid pricing format. Ensure it's a valid JSON array." });
            }

            if (!Array.isArray(parsedPricing) || parsedPricing.length === 0) {
                return reject({ message: "Pricing must be a non-empty array." });
            }

            let imgUrl = null;
            if (req.file) {
                try {
                    imgUrl = await uploadFileToS3(req.file);
                } catch (uploadError) {
                    return reject({ message: `Failed to upload image: ${uploadError.message}` });
                }
            }

            if (actionType === "create") {
                // 🚀 **Create New Service**
                const insertedService = await db("services")
                    .insert({
                        name,
                        categoryId,
                        imgUrl,
                        created_at: new Date(),
                        updated_at: new Date(),
                    })
                    .returning("id");

                const newServiceId = insertedService[0].id || insertedService[0];

                await db("priceforservices").insert(
                    parsedPricing.map(price => ({
                        serviceId: newServiceId,
                        artistlevelId: price.artistlevelId,
                        price: price.price,
                    }))
                );

                resolve({
                    message: "Service created successfully.",
                    serviceId: newServiceId,
                    imgUrl,
                });

            } else if (actionType === "update") {
                // 🔄 **Update Existing Service**
                if (!serviceId) {
                    return reject({ message: "Service ID is required for updating." });
                }

                const serviceExists = await db("services").where({ id: serviceId }).first();
                if (!serviceExists) {
                    return reject({ message: "Service not found." });
                }

                await db("services")
                    .where({ id: serviceId })
                    .update({
                        name,
                        categoryId,
                        imgUrl: imgUrl || serviceExists.imgUrl, // Retain old image if no new one is uploaded
                        updated_at: new Date(),
                    });

                await db("priceforservices").where({ serviceId }).del(); // Remove old prices
                await db("priceforservices").insert(
                    parsedPricing.map(price => ({
                        serviceId,
                        artistlevelId: price.artistlevelId,
                        price: price.price,
                    }))
                );

                resolve({
                    message: "Service updated successfully.",
                    serviceId,
                    imgUrl: imgUrl || serviceExists.imgUrl,
                });
            }
        } catch (err) {
            console.error("Error processing service:", err);
            reject({ message: "Internal server error." });
        }
    });
};

module.exports.deleteService = async (req) => {
    return new Promise(async (resolve, reject) => {
        try {
            const { serviceId } = req.params;

            if (!serviceId) {
                return reject({ message: "Service ID is required." });
            }

            const service = await db("services").where({ id: serviceId }).first();

            if (!service) {
                return reject({ message: "Service not found." });
            }

            await db("priceforservices").where({ serviceId }).del();

            const subServices = await db("subcategories").where({ serviceId }).select("id", "imgUrl");

            for (const subService of subServices) {
                if (subService.imgUrl) {
                    await deleteFileFromS3(subService.imgUrl);
                }
                await db("subcategories").where({ id: subService.id }).del();
            }

            if (service.imgUrl) {
                await deleteFileFromS3(service.imgUrl);
            }

            await db("services").where({ id: serviceId }).del();

            resolve({ message: "Service deleted successfully." });
        } catch (err) {
            console.error("Error deleting service:", err);
            reject({ message: "Internal server error." });
        }
    });
};
// Sub-Service 
module.exports.createOrUpdateSubService = async (req) => {
    return new Promise(async (resolve, reject) => {
        try {
            const { name, serviceId, actionType, subServiceId } = req.body;

            // Validate action type
            if (!actionType || (actionType !== "create" && actionType !== "update")) {
                return reject({ message: "Invalid actionType. Use 'create' or 'update'." });
            }

            // Validate required fields
            if (!name || !serviceId) {
                return reject({ message: "Missing required fields: name or serviceId." });
            }

            // Upload image if provided
            let imgUrl = null;
            if (req.file) {
                try {
                    imgUrl = await uploadFileToS3(req.file);
                } catch (uploadError) {
                    return reject({ message: `Failed to upload image: ${uploadError.message}` });
                }
            }

            if (actionType === "create") {
                // 🚀 **Create New Sub-Service**
                const insertedSubService = await db("subcategories")
                    .insert({
                        name,
                        serviceId,
                        imgUrl,
                    })
                    .returning("id");

                const newSubServiceId = insertedSubService[0].id || insertedSubService[0];

                resolve({
                    message: "Sub-service created successfully.",
                    subServiceId: newSubServiceId,
                    imgUrl,
                });

            } else if (actionType === "update") {
                // 🔄 **Update Existing Sub-Service**
                if (!subServiceId) {
                    return reject({ message: "Sub-service ID is required for updating." });
                }

                const subServiceExists = await db("subcategories").where({ id: subServiceId }).first();
                if (!subServiceExists) {
                    return reject({ message: "Sub-service not found." });
                }

                await db("subcategories")
                    .where({ id: subServiceId })
                    .update({
                        name,
                        serviceId,
                        imgUrl: imgUrl || subServiceExists.imgUrl,
                    });

                resolve({
                    message: "Sub-service updated successfully.",
                    subServiceId,
                    imgUrl: imgUrl || subServiceExists.imgUrl,
                });
            }
        } catch (err) {
            console.error("Error processing sub-service:", err);
            reject({ message: "Internal server error." });
        }
    });
};

module.exports.deleteSubService = async (req) => {
    return new Promise(async (resolve, reject) => {
        try {
            const { subServiceId } = req.params;

            if (!subServiceId) {
                return reject({ message: "Sub-service ID is required for deletion." });
            }

            const subService = await db("subcategories").where({ id: subServiceId }).first();
            if (!subService) {
                return reject({ message: "Sub-service not found." });
            }

            if (subService.imgUrl) {
                await deleteFileFromS3(subService.imgUrl);
            }
            // if (subService.imgUrl) {
            //     try {
            //         await deleteFileFromS3(subService.imgUrl);
            //     } catch (s3Error) {
            //         console.error("Error deleting image from S3:", s3Error);
            //         return reject({ message: "Failed to delete image from S3." });
            //     }
            // }

            await db("subcategories").where({ id: subServiceId }).del();

            resolve({
                message: "Sub-service deleted successfully.",
                subServiceId,
            });
        } catch (err) {
            console.error("Error deleting sub-service:", err);
            reject({ message: "Internal server error." });
        }
    });
};

module.exports.getSubServicesByServiceId = async (req, res) => {
    try {
        const { serviceId } = req.params;
        let { page, limit, subservice_name } = req.query;

        if (!serviceId) {
            return res.status(400).json({ message: "Service ID is required." });
        }

        page = parseInt(page) || 1;
        limit = parseInt(limit) || 10;
        const offset = (page - 1) * limit;

        subservice_name = subservice_name ? subservice_name.trim().toLowerCase() : "";

        let subServicesQuery = db("subcategories").where({ serviceId });

        if (subservice_name) {
            subServicesQuery = subServicesQuery.andWhere("name", "like", `%${subservice_name}%`);
        }

        const subServicesRaw = await subServicesQuery
            .select("id", "name", "imgUrl", "serviceId");

        const pricing = await db("priceforservices")
            .where("serviceId", serviceId)
            .select("*");

        const service = await db("services")
            .where("id", serviceId)
            .first();

        if (!subServicesRaw.length) {
            return res.status(404).json({
                message: "No sub-services found for this service ID.",
                total: 0,
                subServices: [],
            });
        }

        const subServicesMap = new Map();

        subServicesRaw.forEach(({ id, name, imgUrl, serviceId }) => {
            const key = `${name.toLowerCase()}-${serviceId}`;

            if (!subServicesMap.has(key)) {
                subServicesMap.set(key, {
                    id,
                    name,
                    serviceId,
                    imgUrls: [],
                });
            }

            if (imgUrl) {
                subServicesMap.get(key).imgUrls.push({ id, imgUrl });
            }
        });

        const groupedSubServices = Array.from(subServicesMap.values());

        res.status(200).json({
            message: "Sub-services retrieved successfully.",
            total: groupedSubServices.length,
            currentPage: page,
            totalPages: Math.ceil(groupedSubServices.length / limit),
            serviceprice: pricing,
            service: service,
            subServices: groupedSubServices.slice(offset, offset + limit),
        });
    } catch (err) {
        console.error("Error retrieving sub-services:", err);
        res.status(500).json({ message: "Internal server error." });
    }
};


