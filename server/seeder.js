const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Room = require('./src/models/Room');
const User = require('./src/models/User');
const Amenity = require('./src/models/Amenity');
const RoomType = require('./src/models/RoomType');

dotenv.config();

const rooms = [
    {
        name: 'Royal Ocean Villa',
        type: 'Villa',
        description: 'Perched over the turquoise waters, this villa offers ultimate privacy with a private infinity pool and direct lagoon access. Experience the rhythm of the waves in complete luxury.',
        pricePerNight: 1200,
        maxGuests: 4,
        maxChildren: 4,
        totalRooms: 3,
        amenities: ['WiFi', 'Pool', 'Breakfast', 'AC', 'Spa'],
        images: [
            'https://images.unsplash.com/photo-1439066615861-d1af74d74000?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1544124499-58912cbddaad?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1590490359683-658d3d23f972?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        ],
        categorizedImages: {
            morningLight: [
                'C:/Users/pc/.gemini/antigravity/brain/81d3b6fb-0f6b-4bb8-ba0c-3f782f769ba1/morning_light_sample_1_1776689890335.png',
                'C:/Users/pc/.gemini/antigravity/brain/81d3b6fb-0f6b-4bb8-ba0c-3f782f769ba1/morning_light_sample_2_1776689922269.png',
                'C:/Users/pc/.gemini/antigravity/brain/81d3b6fb-0f6b-4bb8-ba0c-3f782f769ba1/morning_light_sample_3_1776689948473.png'
            ],
            roomDetails: [
                'C:/Users/pc/.gemini/antigravity/brain/81d3b6fb-0f6b-4bb8-ba0c-3f782f769ba1/room_details_sample_1_1776689984535.png',
                'C:/Users/pc/.gemini/antigravity/brain/81d3b6fb-0f6b-4bb8-ba0c-3f782f769ba1/room_details_sample_2_1776690039103.png',
                'C:/Users/pc/.gemini/antigravity/brain/81d3b6fb-0f6b-4bb8-ba0c-3f782f769ba1/room_details_sample_3_1776690107861.png'
            ],
            outdoorCalm: [
                'https://images.unsplash.com/photo-1544124499-58912cbddaad?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1590490359683-658d3d23f972?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1507038772120-7fff76f79d79?auto=format&fit=crop&w=1200&q=80'
            ]
        },
        availability: true
    },
    {
        name: 'Horizon Penthouse',
        type: 'Suite',
        description: 'Our most expansive suite, offering 360-degree views of the resort and ocean. Elegant interiors paired with a massive terrace for unforgettable sunsets.',
        pricePerNight: 850,
        maxGuests: 2,
        maxChildren: 2,
        totalRooms: 4,
        amenities: ['WiFi', 'Breakfast', 'AC', 'TV'],
        images: [
            'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        ],
        availability: true
    },
    {
        name: 'Tropical Garden Suite',
        type: 'Deluxe',
        description: 'Nestled within lush greenery, this suite provides a serene escape for nature lovers. Features a private garden shower and a tranquil veranda.',
        pricePerNight: 500,
        maxGuests: 2,
        maxChildren: 2,
        totalRooms: 6,
        amenities: ['WiFi', 'AC', 'Parking'],
        images: [
            'https://images.unsplash.com/photo-1591088398332-8a77d399e80c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1507038772120-7fff76f79d79?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        ],
        availability: true
    }
];

const amenities = [
    { name: 'WiFi', description: 'High-speed wireless internet access', icon: 'wifi' },
    { name: 'Pool', description: 'Access to resort swimming pool', icon: 'pool' },
    { name: 'Breakfast', description: 'Complimentary breakfast service', icon: 'coffee' },
    { name: 'AC', description: 'Air conditioning in all rooms', icon: 'wind' },
    { name: 'Spa', description: 'Access to spa and wellness facilities', icon: 'spa' },
    { name: 'TV', description: 'Flat-screen television with cable', icon: 'tv' },
    { name: 'Parking', description: 'Free parking available', icon: 'car' },
    { name: 'Gym', description: 'Access to fitness center', icon: 'dumbbell' },
    { name: 'Bar', description: 'In-room minibar service', icon: 'glass' },
    { name: 'Room Service', description: '24/7 room service available', icon: 'utensils' }
];

const roomTypes = [
    { name: 'Villa', description: 'Luxurious standalone villas with private amenities' },
    { name: 'Suite', description: 'Spacious suites with premium furnishings and views' },
    { name: 'Deluxe', description: 'Comfortable rooms with modern amenities and comfort' },
    { name: 'Standard', description: 'Cozy rooms perfect for budget-conscious travelers' }
];

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/resort');
        
        await Room.deleteMany();
        console.log('Existing rooms cleared.');
        
        await Room.insertMany(rooms);
        console.log('Luxury rooms seeded successfully.');

        await Amenity.deleteMany();
        console.log('Existing amenities cleared.');
        
        await Amenity.insertMany(amenities);
        console.log('Amenities seeded successfully.');

        await RoomType.deleteMany();
        console.log('Existing room types cleared.');
        
        await RoomType.insertMany(roomTypes);
        console.log('Room types seeded successfully.');

        // Create an admin user if not exists
        const adminExists = await User.findOne({ email: 'admin@resort.com' });
        if (!adminExists) {
            await User.create({
                name: 'Admin',
                email: 'admin@resort.com',
                password: 'adminpassword123',
                isAdmin: true
            });
            console.log('Admin user created: admin@resort.com / adminpassword123');
        }

        // Create a regular user if not exists
        const userExists = await User.findOne({ email: 'guest@example.com' });
        if (!userExists) {
            await User.create({
                name: 'John Guest',
                email: 'guest@example.com',
                password: 'password123',
                isAdmin: false
            });
            console.log('Regular user created: guest@example.com / password123');
        }

        process.exit();
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedData();
