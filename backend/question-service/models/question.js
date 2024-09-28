const mongoose = require("mongoose");
const z = require("zod");
const urlSchema = z.string().url();

const questionSchema = mongoose.Schema({
    id: {
        type: Number,
        unique: true
    },
    title: {
        type: String,
        required: [true, "Title is required"],
        unique: [true, "Question Title must be unique."]
    },
    description: {
        type: String,
        required: [true, "Desc is required"]
    },
    category: {
        type: [String],
        enum: [
            "Algorithms", 
            "Arrays", 
            "Bit Manipulation", 
            "Brainteaser", 
            "Databases", 
            "Data Structures", 
            "Recursion", 
            "Strings"
          ],
        required: [true, "Category is required"]
    },
    complexity: {
        type: String,
        enum: ["Easy", "Medium", "Hard"],
        required: [true, "Complexity is required"]
    },
    link: {
        type: String,
        required: [true, "URL is required"],
        validate: {
            validator: v => {
                parsedURL = urlSchema.parse(v)
                return parsedURL.data
            },
            message: msg => `${msg.value} is not a valid URL!`
        }
    }
});

const questionModel = mongoose.model("Question", questionSchema);

module.exports = questionModel;