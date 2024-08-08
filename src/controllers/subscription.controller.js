import mongoose, { isValidObjectId } from "mongoose"
import { User } from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    const channel = await User.findById(channelId);
    //   then we have find in user database

    if (!channel) {
        throw new ApiError(400, "channel not found");
    }

    const isSubscribed = await Subscription.findOne({
        subscriber: req.user?._id,
        channel: channelId,
    });

    console.log(isSubscribed);

    if (isSubscribed) {
        const unSubscribeChannel = await Subscription.findByIdAndDelete(
            isSubscribed._id
        );
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    unSubscribeChannel,
                    "channel unsubscribed successfully"
                )
            );
    } else {
        const newSubscription = await Subscription.create({
            subscriber: req.user._id,
            channel: channelId,
        });
        return res
            .status(200)
            .json(
                new ApiResponse(200, newSubscription, "channel subscribed successfully")
            );
    }
    // TODO: toggle subscription
})


// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}