import { createClient } from '@insforge/sdk';

const client = createClient('https://4w8g54a3.ap-southeast.insforge.app', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0NjYyNzZ9.HS7LtJ4NFnJoKdwO4QCBADLJXiKGQqJL0VHkrq2GwKs');

async function run() {
    const { data, error } = await client.functions.invoke('verify-razorpay-payment', {
        body: {
            orderId: 'test-xyz',
            razorpay_payment_id: 'pay_xyz',
            razorpay_order_id: 'order_xyz',
            razorpay_signature: 'invalid_sig'
        }
    });
    console.log('Error:', error);
    console.log('Data:', data);
}
run();
