import { ICart } from "./cart.interface";

const calculateThePrice = (cartItems:ICart[],discount:number=0)=>{
    const products_price = cartItems.reduce((acc, item) => acc + item.total_price, 0);
    let serviceFee = products_price * 0.05;

    const delivery_charge = 50;
    const tax = products_price * 0.05;
    let  total = products_price + serviceFee + delivery_charge+tax;
    const subtotal = total
    let discount_amount = 0
    if(discount){
        discount_amount = total * (discount / 100);
        total = total - (total * (discount / 100));
    }

    return {products_price,serviceFee,delivery_charge,discount_amount:discount_amount,total_price:total,tax,subtotal}
}

export const CartHelper = {
    calculateThePrice
}