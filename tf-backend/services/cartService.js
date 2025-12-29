const conn = require('../connection/database');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

class CartService {

    /**
     * Get the active cart for a user.
     * @param {string} userId
     */
    async getCart(userId) {
        if (!userId) throw new Error("User ID is required");

        const query = `SELECT * FROM usercart WHERE userId = ? AND isActive = 1`;
        const [rows] = await conn.promise().query(query, [userId]);

        if (rows.length === 0) {
            return null;
        }

        const cartData = {
            Id: rows[0].id,
            userId: rows[0].userId,
            totalAmount: rows[0].totalAmount,
            bookingFee: rows[0].bookingFee,
            addressId: rows[0].addressId,
            totalGratuity: rows[0].totalGratuity,
            bookingTime: rows[0].bookingTime,
            addOnAmount: rows[0].addOnAmount || 0,
            longHairAmount: rows[0].longHairAmount || 0,
            later: [],
            now: []
        };

        // Helper to fetch items
        const fetchItems = async (type) => {
            const itemQuery = `
                SELECT 
                    a.Id, a.cartId, a.serviceId, a.quantity, a.price, a.bookingType, 
                    a.gratuity, a.bookingTime, a.addOnAmount, a.longHairAmount, 
                    a.imageUrl, a.artist, b.name, b.id AS subId, 
                    s.categoryId AS categoryId 
                FROM cartitems a 
                JOIN subcategories b ON a.subCategoryId = b.id 
                JOIN services s ON s.id = a.serviceId 
                WHERE a.cartId = ? AND a.bookingType = ? 
                ORDER BY a.createddate DESC`;

            const [items] = await conn.promise().query(itemQuery, [cartData.Id, type]);
            return items;
        };

        cartData.later = await fetchItems('later');
        cartData.now = await fetchItems('now');

        return cartData;
    }

    /**
     * Replace existing active cart with a new one (Action: 'A').
     * Sets current active cart to inactive.
     */
    async replaceCart(userId, cartData) {
        const { bookingFee, addressId, later, now, bookingTime } = cartData;
        const uniqueID = uuidv4();
        const dateTime = moment().format('YYYY-MM-DD HH:mm:ss');
        const connection = await conn.promise().getConnection();

        try {
            await connection.beginTransaction();

            // Deactivate old cart
            await connection.query('UPDATE usercart SET isActive=0 WHERE userId = ?', [userId]);

            let totalAmount = 0;
            let totalGratuity = 0;
            let addOnAmount = 0;
            let longHairAmount = 0;

            const processItems = (items) => {
                if (!items || !items.length) return [];
                const values = [];
                items.forEach(item => {
                    const price = parseFloat(item.price) || 0;
                    const qty = parseInt(item.quantity) || 1;
                    const grat = parseFloat(item.gratuity) || 0;
                    const add = parseFloat(item.addOnAmount) || 0;
                    const long = parseFloat(item.longHairAmount) || 0;

                    totalAmount += price * qty;
                    totalGratuity += grat;
                    addOnAmount += add;
                    longHairAmount += long;

                    values.push([
                        uuidv4(),
                        uniqueID,
                        item.serviceId,
                        qty,
                        price,
                        item.bookingType || (now.includes(item) ? 'now' : 'later'),
                        grat,
                        item.bookingTime,
                        item.imageUrl,
                        item.artist,
                        item.subCategoryId,
                        add,
                        long,
                        moment().format('YYYY-MM-DD HH:mm:ss.SSS')
                    ]);
                });
                return values;
            };

            const laterValues = processItems(later);
            const nowValues = processItems(now);

            // Create new cart
            const insertCartQuery = `
                INSERT INTO usercart
                (id, userId, createdAt, updatedAt, totalAmount, bookingFee, addressId, totalGratuity, addOnAmount, longHairAmount, isActive, bookingTime)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`;

            await connection.query(insertCartQuery, [
                uniqueID, userId, dateTime, dateTime, totalAmount, bookingFee, addressId, totalGratuity, addOnAmount, longHairAmount, bookingTime || null
            ]);

            const insertItemsQuery = `
                INSERT INTO cartitems 
                (Id, cartId, serviceId, quantity, price, bookingType, gratuity, bookingTime, imageUrl, artist, subCategoryId, addOnAmount, longHairAmount, createddate)
                VALUES ?`;

            if (laterValues.length) await connection.query(insertItemsQuery, [laterValues]);
            if (nowValues.length) await connection.query(insertItemsQuery, [nowValues]);

            await connection.commit();
            return await this.getCart(userId); // Return full object

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Update existing active cart. (Action: 'U')
     */
    async updateCart(userId, cartData) {
        const { cartId, bookingFee, addressId, later, now, bookingTime } = cartData;
        const connection = await conn.promise().getConnection();
        const dateTime = moment().format('YYYY-MM-DD HH:mm:ss');

        try {
            await connection.beginTransaction();

            const [cartRows] = await connection.query('SELECT * FROM usercart WHERE id = ? AND userId = ? AND isActive = 1', [cartId, userId]);
            if (!cartRows.length) throw new Error("Active cart not found.");

            let totalAmount = 0;
            let totalGratuity = 0;
            let addOnAmount = 0;
            let longHairAmount = 0;

            const calculateTotals = (items) => {
                if (!items) return;
                items.forEach(item => {
                    totalAmount += (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 1);
                    totalGratuity += parseFloat(item.gratuity) || 0;
                    addOnAmount += parseFloat(item.addOnAmount) || 0;
                    longHairAmount += parseFloat(item.longHairAmount) || 0;
                });
            };

            calculateTotals(later);
            calculateTotals(now);

            // Update Cart Header
            await connection.query(`
                UPDATE usercart 
                SET updatedAt = ?, totalAmount = ?, bookingFee = ?, addressId = ?, totalGratuity = ?, addOnAmount = ?, longHairAmount = ?, bookingTime = ?
                WHERE id = ?`,
                [dateTime, totalAmount, bookingFee, addressId, totalGratuity, addOnAmount, longHairAmount, bookingTime, cartId]
            );

            // Helper to update/insert items
            const upsertItems = async (items, type) => {
                if (!items || !items.length) return;
                const newItemsValues = [];

                for (const item of items) {
                    if (item.Id) {
                        // Update existing
                        await connection.query(`
                            UPDATE cartitems SET quantity=?, price=?, gratuity=?, bookingTime=?, addOnAmount=?, longHairAmount=? WHERE Id=?`,
                            [item.quantity, item.price, item.gratuity, bookingTime, item.addOnAmount, item.longHairAmount, item.Id]
                        );
                    } else {
                        // Prepare for insert
                        newItemsValues.push([
                            uuidv4(), cartId, item.serviceId, item.quantity, item.price, type,
                            item.gratuity, bookingTime, item.imageUrl, item.artist, item.subCategoryId,
                            item.addOnAmount || 0, item.longHairAmount || 0, moment().format('YYYY-MM-DD HH:mm:ss.SSS')
                        ]);
                    }
                }

                if (newItemsValues.length) {
                    await connection.query(`
                        INSERT INTO cartitems (Id, cartId, serviceId, quantity, price, bookingType, gratuity, bookingTime, imageUrl, artist, subCategoryId, addOnAmount, longHairAmount, createddate)
                        VALUES ?`, [newItemsValues]
                    );
                }
            };

            await upsertItems(later, 'later');
            await upsertItems(now, 'now');

            await connection.commit();
            return await this.getCart(userId);

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Delete specific items from cart (Action: 'D').
     * Recalculates totals.
     */
    async deleteCartItems(userId, cartData) {
        const { cartId, later, now } = cartData;
        const connection = await conn.promise().getConnection();
        const dateTime = moment().format('YYYY-MM-DD HH:mm:ss');

        try {
            await connection.beginTransaction();

            const [cartRows] = await connection.query('SELECT * FROM usercart WHERE id = ? AND userId = ? AND isActive = 1', [cartId, userId]);
            if (!cartRows.length) throw new Error("Active cart not found.");

            let { totalAmount, totalGratuity, addOnAmount, longHairAmount } = cartRows[0];

            const processDeletions = async (items) => {
                if (!items || !items.length) return;
                for (const item of items) {
                    if (item.Id) {
                        const [itemRows] = await connection.query('SELECT * FROM cartitems WHERE Id = ? AND cartId = ?', [item.Id, cartId]);
                        if (itemRows.length) {
                            const dbItem = itemRows[0];
                            totalAmount -= dbItem.price * dbItem.quantity;
                            totalGratuity -= dbItem.gratuity || 0;
                            addOnAmount -= dbItem.addOnAmount || 0;
                            longHairAmount -= dbItem.longHairAmount || 0;

                            await connection.query('DELETE FROM cartitems WHERE Id = ?', [item.Id]);
                        }
                    }
                }
            };

            await processDeletions(later);
            await processDeletions(now);

            // Update Cart Header with new totals
            await connection.query(`
                UPDATE usercart 
                SET updatedAt = ?, totalAmount = ?, totalGratuity = ?, addOnAmount = ?, longHairAmount = ?
                WHERE id = ?`,
                [dateTime, totalAmount, totalGratuity, addOnAmount, longHairAmount, cartId]
            );

            await connection.commit();
            return await this.getCart(userId);

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Deactivate cart (Action: 'C').
     */
    async deactivateCart(cartId, userId) {
        // Validation that cart belongs to user
        const [result] = await conn.promise().query(`UPDATE usercart SET isActive = 0, updatedAt = NOW() WHERE id = ? AND userId = ?`, [cartId, userId]);
        if (result.affectedRows === 0) {
            throw new Error("Cart not found or not active.");
        }
        return { message: "Cart cleaned successfully" };
    }
}

module.exports = new CartService();
