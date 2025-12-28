import AuthorizedEmail from '../models/AuthorizedEmail.js';

// Get all authorized emails
export const getAuthorizedEmails = async (req, res) => {
    try {
        const emails = await AuthorizedEmail.find().sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: emails,
            count: emails.length
        });

    } catch (error) {
        console.error('Get Authorized Emails Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch authorized emails',
            error: error.message
        });
    }
};

// Add new authorized email (Protected route)
export const addAuthorizedEmail = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        // Check if email already exists
        const existingEmail = await AuthorizedEmail.findOne({ email: email.toLowerCase() });

        if (existingEmail) {
            return res.status(400).json({
                success: false,
                message: 'This email is already authorized'
            });
        }

        // Create new authorized email
        const newEmail = await AuthorizedEmail.create({
            email: email.toLowerCase(),
            addedBy: req.user.email
        });

        res.status(201).json({
            success: true,
            message: 'Email authorized successfully',
            data: newEmail
        });

    } catch (error) {
        console.error('Add Authorized Email Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add authorized email',
            error: error.message
        });
    }
};

// Remove authorized email (Protected route)
export const removeAuthorizedEmail = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedEmail = await AuthorizedEmail.findByIdAndDelete(id);

        if (!deletedEmail) {
            return res.status(404).json({
                success: false,
                message: 'Authorized email not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Authorized email removed successfully'
        });

    } catch (error) {
        console.error('Remove Authorized Email Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove authorized email',
            error: error.message
        });
    }
};
