const {publishableKey} = await fetch('/config').then(r=>r.json());
const stripe = Stripe(pk_test_51Ot8H8IYD2Ak4FLoPHpmVZsGQY9mtmlaJBqmDxQvuqi6HsM9oDkIal74YGlJDw0LuWqNxb8r1eD8cH1Q2yjGtvpW00crbHgrlB);//this is the publishable key

var verifyButton = document.getElementById('verify-button');
verifyButton.addEventListener('click', async () => {
  try {
    const {client_secret} = await fetch('/create-verification-session', { method: 'POST' }).then(r => r.json())
    const {error} = await stripe.verifyIdentity(client_secret);
    
    if(!error) {
      window.location.href = '/submitted.html';
    } else {
      alert(error.message);
    }
  } catch(e) {
    alert(e.message);
  }
});
