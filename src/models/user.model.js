import mongoose, { Schema } from "mongoose";
import JWT from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        index: true,
        unique: true,
    },
    email: {
        type: String,
        unique: true,
        required: true,
        lowercase: true,
        trim: true,
    },
    fullName: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    passsword: {
        type: String,
        required: [true, "Password is required."],
    },
    avatar: {
        type: String,
    },
    coverImage: {
        type: String,
    },
    watchHistory: [{
        type: Schema.Types.ObjectId,
        ref: "Video"
    }],
    refreshToken: {
        type: String,
    },
}, { timestamps: true })

userSchema.pre("save", async function (next) {
    if (this.isModified("passsword")) {
        this.passsword = await bcrypt.hash(this.passsword, 10);
        next();
    } else {
        next();
    }
})

userSchema.methods.isPasswordCorrect = async function (passsword) {
    return await bcrypt.compare(passsword, this.passsword);
}

userSchema.methods.generateAccessToken = function () {
    return JWT.sign({
        _id: this._id,
    },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: ACCESS_TOKEN_EXPIRY,
        }
    )
}
userSchema.methods.generateRefreshToken = function () {
    return JWT.sign({
        _id: this._id,
    },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: REFRESH_TOKEN_EXPIRY,
        } 
    )
}

export const User = mongoose.model("User", userSchema);