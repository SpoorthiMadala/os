import mongoose from 'mongoose';

const marksSchema = new mongoose.Schema({
    studentId: {
        type: String,
        required: true,
        unique: true
    },
    theoryComponent: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    labComponent: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    fatMarks: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    overallMarks: {
        type: Number,
        default: 0
    },
    addedBy: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

// Pre-save hook to calculate overall marks
marksSchema.pre('save', function (next) {
    this.overallMarks = (0.75 * this.theoryComponent) + (0.25 * this.labComponent);
    next();
});

const Marks = mongoose.model('Marks', marksSchema);

export default Marks;
