import mongoose from 'mongoose';

const authorizedEmailSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    addedBy: {
        type: String,
        default: 'admin'
    }
}, {
    timestamps: true
});

const AuthorizedEmail = mongoose.model('AuthorizedEmail', authorizedEmailSchema);

export default AuthorizedEmail;
