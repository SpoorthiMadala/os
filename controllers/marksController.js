import Marks from '../models/Marks.js';
import User from '../models/User.js';

// Get all marks for Overall Marks tab
export const getOverallMarks = async (req, res) => {
    try {
        const marks = await Marks.find()
            .select('studentId theoryComponent labComponent overallMarks')
            .sort({ overallMarks: 1 }); // Ascending order

        // Calculate average
        const average = marks.length > 0
            ? marks.reduce((sum, mark) => sum + mark.overallMarks, 0) / marks.length
            : 0;

        res.status(200).json({
            success: true,
            data: marks,
            average: parseFloat(average.toFixed(2)),
            count: marks.length
        });

    } catch (error) {
        console.error('Get Overall Marks Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch marks',
            error: error.message
        });
    }
};

// Get all FAT marks
export const getFATMarks = async (req, res) => {
    try {
        const marks = await Marks.find()
            .select('studentId fatMarks')
            .sort({ fatMarks: 1 }); // Ascending order

        // Calculate average
        const average = marks.length > 0
            ? marks.reduce((sum, mark) => sum + mark.fatMarks, 0) / marks.length
            : 0;

        res.status(200).json({
            success: true,
            data: marks,
            average: parseFloat(average.toFixed(2)),
            count: marks.length
        });

    } catch (error) {
        console.error('Get FAT Marks Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch FAT marks',
            error: error.message
        });
    }
};

// Get current user's marks (Protected route)
export const getMyMarks = async (req, res) => {
    try {
        const marks = await Marks.findOne({ addedBy: req.user.email });

        if (!marks) {
            return res.status(404).json({
                success: false,
                message: 'No marks found'
            });
        }

        res.status(200).json({
            success: true,
            data: marks
        });

    } catch (error) {
        console.error('Get My Marks Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch your marks',
            error: error.message
        });
    }
};

// Add or Update marks entry (Protected route)
export const addMarks = async (req, res) => {
    try {
        const { theoryComponent, labComponent, fatMarks } = req.body;

        // Validation
        if (theoryComponent === undefined || labComponent === undefined || fatMarks === undefined) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required: theoryComponent, labComponent, fatMarks'
            });
        }

        // Validate marks range
        if (theoryComponent < 0 || theoryComponent > 100 ||
            labComponent < 0 || labComponent > 100 ||
            fatMarks < 0 || fatMarks > 100) {
            return res.status(400).json({
                success: false,
                message: 'All marks must be between 0 and 100'
            });
        }

        // Check if user has already submitted marks
        const existingMarks = await Marks.findOne({ addedBy: req.user.email });

        let result;
        if (existingMarks) {
            // Update existing marks
            existingMarks.theoryComponent = theoryComponent;
            existingMarks.labComponent = labComponent;
            existingMarks.fatMarks = fatMarks;
            result = await existingMarks.save();

            res.status(200).json({
                success: true,
                message: 'Marks updated successfully!',
                data: result
            });
        } else {
            // Create new marks entry
            const count = await Marks.countDocuments();
            const studentId = `STU${String(count + 1).padStart(3, '0')}`;

            result = await Marks.create({
                studentId,
                theoryComponent,
                labComponent,
                fatMarks,
                addedBy: req.user.email
            });

            // Update user's hasSubmittedMarks status
            await User.findOneAndUpdate(
                { email: req.user.email },
                { hasSubmittedMarks: true }
            );

            res.status(201).json({
                success: true,
                message: 'Marks submitted successfully! You can now view all marks.',
                data: result
            });
        }

    } catch (error) {
        console.error('Add Marks Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add marks',
            error: error.message
        });
    }
};
