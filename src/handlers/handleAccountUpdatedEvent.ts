import { StatusCodes } from 'http-status-codes';
import Stripe from 'stripe';

import stripe from '../config/stripe';
import ApiError from '../errors/ApiError';
import mongoose from 'mongoose';
import { Creator, User } from '../app/modules/user/user.model';
import { Wallet } from '../app/modules/wallet/wallet.model';


export const handleAccountUpdatedEvent = async (data: Stripe.Account) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();
            // Find the user by Stripe account ID
    const existingUser = await Creator.findOne({ stripe_account_id: data.id }).session(session);

    if (!existingUser) {
        return console.log('User not found');
    }

    // Check if the onboarding is complete
    if (data.charges_enabled) {
        const loginLink = await stripe.accounts.createLoginLink(data.id);
        
        // Save Stripe account information to the user record
        await Creator.findByIdAndUpdate(existingUser?._id, {
            stripe_account_id: data.id,
            stripe_login_link: loginLink.url
        },{session});

        const wallet = await Wallet.findOne({ user: existingUser._id }).session(session);
        if(wallet?.draft_balance){
            await stripe.transfers.create({
                amount: wallet.draft_balance * 100,
                currency: 'usd',
                destination: data.id
            })
        }
    }

        await session.commitTransaction();
        session.endSession();
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
}