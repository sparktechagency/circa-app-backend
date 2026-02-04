import { Request, Response } from "express";
import stripe from "../config/stripe";
import config from "../config";
import { handlePurchaseCheckout } from "../handlers/handlePurchaseCheckout";
import { handleCreditPurchase } from "../handlers/handleCreditPurchase";
import { kafkaProducer } from "../tools/kafka/kafka-producers/kafka.producer";
import { handleSubscriptionPurchase } from "../handlers/handleSubscriptionPurchase";

export const handleStripeWebhook = async (req: Request, res: Response) => {
    try {
        const sig = req.headers['stripe-signature'];
        let event = await stripe.webhooks.constructEvent(req.body, sig!, config.stripe.webhook_secret!);

        switch (event.type) {
            case 'checkout.session.completed':
                const session = event.data.object;
                if(session?.metadata?.packageId && session?.metadata?.userId){
                    await kafkaProducer.sendMessage("user", {type:"purchase-credit",data:session})
                }
                if(session?.metadata?.orderId && session?.metadata?.userId){
                    await kafkaProducer.sendMessage("cart", {type:"order-items",data:session})
                }
                if(session?.metadata?.planId && session?.metadata?.userId){
                    await kafkaProducer.sendMessage("user", {type:"plan-upgrade",data:session})
                }
                break;
            default:
                console.log(`Unhandled event type ${event.type}`);
        }
    } catch (error) {
        console.log(error);
        
    }
}