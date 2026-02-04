import { CartServices } from "../../../app/modules/cart/cart.service";
import { OrderHandler } from "../../../app/modules/order/order.handler";
import { handleOrderPurchase } from "../../../handlers/handleOrderPurchase";
import { kafkaConsumer } from "../kafka-producers/kafka.consumer";

export const cartConsumer =async () => {
    await kafkaConsumer({groupId:"cart",topic:"cart",cb: async(data:{type:string,data:any})=>{
        try {
            switch (data.type) {
                case "add-product":
                    await CartServices.addProductIntoCart(data.data);
                    break;
                case "delete-product":
                    await CartServices.deleteProductFromCart(data.data);
                    break;
                case "update-quantity":
                    await CartServices.increaseOrDecreaseQuantity(data.data.id, data.data.amount);
                    break;
                case "order-items":
                    await handleOrderPurchase(data.data);
                    break;
                case "cancel-order":
                    await OrderHandler.handleCancelOrder(data.data);
                    break;
                default:
                    break;
            }
        } catch (error) {
            
        }
    }})
};