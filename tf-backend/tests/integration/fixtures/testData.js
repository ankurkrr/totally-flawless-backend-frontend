/**
 * Test Data Fixtures
 * Pre-defined test data for integration tests
 */

module.exports = {
    users: {
        regular: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            phone: '+1234567890',
            countryCode: '+1'
        },
        premium: {
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane.smith@example.com',
            phone: '+1987654321',
            countryCode: '+1'
        }
    },

    artists: {
        approved: {
            name: 'Test Artist',
            email: 'artist@example.com',
            phone: '+1234567891',
            businessName: 'Test Beauty Salon',
            address: '123 Main St',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            isApproved: true
        },
        pending: {
            name: 'Pending Artist',
            email: 'pending@example.com',
            phone: '+1234567892',
            businessName: 'Pending Salon',
            address: '456 Oak Ave',
            city: 'Los Angeles',
            state: 'CA',
            zipCode: '90001',
            isApproved: false
        }
    },

    services: {
        haircut: {
            name: 'Haircut',
            description: 'Professional haircut service',
            price: 50.00,
            duration: 60,
            categoryId: null, // Will be set in test
            isActive: true
        },
        massage: {
            name: 'Massage',
            description: 'Relaxing massage service',
            price: 80.00,
            duration: 90,
            categoryId: null,
            isActive: true
        },
        facial: {
            name: 'Facial',
            description: 'Deep cleansing facial',
            price: 75.00,
            duration: 75,
            categoryId: null,
            isActive: true
        }
    },

    addresses: {
        home: {
            addressLine1: '123 Main Street',
            addressLine2: 'Apt 4B',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            country: 'USA',
            isDefault: true
        },
        work: {
            addressLine1: '456 Business Ave',
            addressLine2: 'Suite 200',
            city: 'New York',
            state: 'NY',
            zipCode: '10002',
            country: 'USA',
            isDefault: false
        }
    },

    bookings: {
        pending: {
            bookingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            bookingTime: '10:00',
            bookingType: 'later',
            status: 'pending',
            totalAmount: 100.00,
            amountPaid: 0.00
        },
        confirmed: {
            bookingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            bookingTime: '14:00',
            bookingType: 'later',
            status: 'confirmed',
            totalAmount: 150.00,
            amountPaid: 150.00
        },
        completed: {
            bookingDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Yesterday
            bookingTime: '10:00',
            bookingType: 'later',
            status: 'completed',
            totalAmount: 100.00,
            amountPaid: 100.00,
            gratuity: 15.00,
            rating: 5
        }
    },

    payments: {
        successful: {
            amount: 10000, // in cents
            currency: 'USD',
            status: 'succeeded',
            paymentMethodId: 'pm_test_123'
        },
        pending: {
            amount: 5000,
            currency: 'USD',
            status: 'pending',
            paymentMethodId: 'pm_test_456'
        }
    },

    cart: {
        empty: {
            totalAmount: 0.00,
            isActive: true
        },
        withItems: {
            totalAmount: 150.00,
            isActive: true
        }
    }
};

