const mongoose = require("mongoose");

const UserProgressSchema = new mongoose.Schema(
{
    userId: {
        type: String,
        required: true
    },

    assignmentId: {
        type: String,
        required: true
    },

    sqlQuery: {
        type: String,
        default: ""
    },

    lastAttempt: {
        type: Date,
        default: Date.now
    },

    isCompleted: {
        type: Boolean,
        default: false
    },

    attemptCount: {
        type: Number,
        default: 0
    }
},
{
    timestamps: true
}
);

const UserProgress = mongoose.model("UserProgress", UserProgressSchema);
module.exports = UserProgress;