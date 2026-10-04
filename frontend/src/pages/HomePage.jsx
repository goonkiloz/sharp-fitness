import { useEffect } from 'react';
const markup = `
<div class="bar">Now accepting new clients in San Diego and online. <a href="#contact">Book a free consult</a></div>
<header><div class="w">
<a class="brand" href="#top"><img alt="Sharp Fitness logo" src="/images/sharp-fitness-logo-a24843b318e0.png"/>Sharp Fitness</a>
<nav><a href="#about">About</a><a href="#training">Training</a><a href="#pricing">Pricing</a><a href="#credentials">Credentials</a><a href="#contact">Contact</a></nav>
<a class="account-link" href="/login">Client login</a><a class="btn" href="#contact">Book now</a>
</div></header>
<main id="top">
<div class="hero"><div class="w">
<div>
<h1>Train sharp.<br/>Get <em>stronger</em> at any age.</h1>
<p>Personal training in San Diego from a Master Coach with a master's degree in kinesiology. Bodybuilding, strength, and fitness for clients from 6 to 94.</p>
<div class="row"><a class="btn" href="#contact">Book a free consult</a><a class="btn o" href="sms:+16196421150">Text me: 619-642-1150</a></div>
</div>
<img alt="Sharp Fitness personal trainer in the gym" height="1400" src="/images/hero-trainer-c001d61ff493.jpg" width="787"/>
</div></div>
<section><div class="w">
<h2>I've coached clients from 6 to 94.</h2>
<p>Kids learning to lift safely, adults building their physique, and seniors staying strong and independent. Every program is built around the person in front of me.</p>
<div class="range"><ul>
<li><b>6</b>My youngest client</li><li><b>Teens</b>School weightlifting classes</li><li><b>Adults</b>Strength and bodybuilding</li><li><b>94</b>My oldest client</li>
</ul></div>
<div class="facts">
<div><b>6+</b><span>years of bodybuilding training</span></div>
<div><b>2</b><span>Master Coach certifications</span></div>
<div><b>M.S.</b><span>in Kinesiology</span></div>
</div>
</div></section>
<section class="alt" id="about"><div class="w split">
<img alt="Back view of the trainer in the gym" height="1400" src="/images/trainer-back-fdd861125f27.jpg" width="787"/>
<div>
<h2>Coaching built on science and six years under the bar.</h2>
<p>I'm Cody, the coach behind Sharp Fitness. I've trained for men's bodybuilding for six years, so I know what it takes to build muscle, shape a physique, and stay consistent when motivation dips.</p>
<p>I back that up with a master's degree in kinesiology from Washburn University and Master Coach certifications from both NASM and ISSA. You get a plan grounded in how the body actually works, delivered by a coach who trains the way he teaches.</p>
<a class="btn" href="#contact">Start training with me</a>
</div>
</div></section>
<section id="training"><div class="w">
<h2>How I can help you train.</h2>
<div class="svc">
<div><h3>Bodybuilding and physique</h3><p>Hypertrophy programming, exercise technique, and nutrition-minded coaching to build size, symmetry, and strength.</p></div>
<div><h3>One-on-one strength training</h3><p>Personalized sessions for fat loss, muscle gain, and getting stronger, with form coaching on every lift.</p></div>
<div><h3>Youth and school programs</h3><p>Safe, fun weightlifting instruction for kids and teens. I've taught weightlifting classes in schools.</p></div>
<div><h3>Senior and lifelong fitness</h3><p>Strength, balance, and mobility training that keeps older adults capable and independent. My oldest client is 94.</p></div>
</div>
<h2 id="pricing" style="margin-top:72px">Coaching options and pricing.</h2>
<ul class="plans">
<li><div><h3>Workout and nutrition programs</h3><p>A personalized 16-week training and nutrition program built around you. Pay once and keep access to everything Cody delivers.</p><a class="btn pick" data-k="workout" data-plan="Workout and nutrition program" href="/programs?plan=workout-nutrition-program">View &amp; purchase</a></div><div class="pr">$20<small>starting at</small></div></li>
<li><div><h3>Online coaching with nutrition plan</h3><p>Remote monthly coaching with training and nutrition built around your goals. If you stop coaching, you keep everything already delivered to your account.</p><a class="btn pick" data-k="online" data-plan="Online coaching with nutrition plan" href="/programs?plan=online-coaching">View &amp; purchase</a></div><div class="pr">$100<small>per month, starting at</small></div></li>
<li><div><h3>1-on-1 coaching, in person or online</h3><p>Custom monthly programming plus weekly check-ins. If coaching ends, everything already delivered to your account stays available.</p><a class="btn pick" data-k="oneonone" data-plan="1-on-1 coaching" href="/programs?plan=one-on-one-coaching">View &amp; purchase</a></div><div class="pr">$200<small>per month</small></div></li>
</ul>
<p class="auth-note" style="margin-top:20px;color:var(--mut)">Create an account or sign in to purchase securely. Personalized files Cody delivers stay in your client dashboard permanently; monthly payment controls new coaching/content, not access to your history.</p>
<p style="color:var(--mut)">Not sure which option fits? <a href="#contact">Book a free consult</a> and we'll pick the right one together.</p>
</div></section>
<section class="alt" id="credentials"><div class="w">
<h2>Credentials.</h2>
<ul class="cred">
<li><b>Master's degree in Kinesiology</b><span>Washburn University</span></li>
<li><b>Master Coach certification</b><span>NASM</span></li>
<li><b>Master Coach certification</b><span>ISSA</span></li>
<li><b>6+ years of bodybuilding training</b><span>Men's bodybuilding</span></li>
<li><b>Currently coaching</b><span>24 Hour Fitness, Balboa Ave, San Diego</span></li>
</ul>
</div></section>
<section class="faq"><div class="w">
<h2>Questions, answered.</h2>
<details><summary>Where do you train clients in person?</summary><p>At 24 Hour Fitness on Balboa Ave in San Diego.</p></details>
<details><summary>Can I train with you online?</summary><p>Yes. I offer online coaching with a nutrition plan from $100 a month, and 1-on-1 coaching online or in person for $200 a month.</p></details>
<details><summary>Do you work with beginners, kids, or seniors?</summary><p>Yes. I've trained clients from age 6 to age 94 and taught weightlifting classes in schools. Every program is matched to your experience and goals.</p></details>
<details><summary>What does 1-on-1 coaching include?</summary><p>Custom programming and weekly check-ins, in person or online, for $200 a month.</p></details>
<details><summary>What if I just want a program to follow on my own?</summary><p>The $20 option is a personalized 16-week workout and nutrition program. It is a one-time payment, and you keep access to everything Cody delivers for the program.</p></details>
<details><summary>How do I get started?</summary><p>Book a free consult below, or call or text me at 619-642-1150. We'll talk through your goals and pick the right option.</p></details>
</div></section>
<section class="loc"><div class="w split">
<img alt="Trainer in the locker room after a workout" height="1200" src="/images/trainer-locker-room-d077db47c7d1.jpg" width="900"/>
<div>
<h2>Train with me in San Diego.</h2>
<p>I coach at 24 Hour Fitness on Balboa Ave. Send a message with your goals and I'll set up a free consult to build your plan.</p>
<a class="btn" href="#contact">Book a free consult</a>
</div>
</div></section>
<section class="soc"><div class="w">
<h2>Follow the training.</h2>
<p>Follow along on Instagram and TikTok for training, physique updates, and coaching.</p>
<div class="row"><a class="btn" href="https://instagram.com/c0dyylifts" rel="noopener" target="_blank">Instagram @c0dyylifts</a><a class="btn" href="https://www.tiktok.com/@codyylifts" rel="noopener" target="_blank">TikTok @codyylifts</a></div>
</div></section>
<section class="alt" id="contact"><div class="w contact">
<div>
<h2>Book your free consult.</h2>
<form id="f">
<label>Your name<input autocomplete="name" name="n" required=""/></label>
<label>Phone or email<input name="c" required=""/></label>
<label>Your main goal<select name="g"><option>Build muscle</option><option>Lose fat</option><option>Bodybuilding prep</option><option>Training for my child or teen</option><option>Senior fitness</option><option>Something else</option></select></label>
<label>Option you're interested in<select id="pl" name="p"><option>Not sure yet</option><option>Workout and nutrition program</option><option>Online coaching with nutrition plan</option><option>1-on-1 coaching</option></select></label>
<label>Anything else I should know?<textarea name="m" rows="4"></textarea></label>
<button class="btn" type="submit">Send my request</button>
<p hidden="" id="ok"></p>
</form>
</div>
<div class="side">
<img alt="Sharp Fitness logo" height="180" src="/images/sharp-fitness-logo-a24843b318e0.png" width="180"/>
<h3>Sharp Fitness</h3>
<p>Personal training at 24 Hour Fitness, Balboa Ave, San Diego.</p>
<ul class="links">
<li><span>Phone</span><a href="tel:+16196421150">619-642-1150</a></li>
<li><span>Email</span><a href="mailto:codysharp011@outlook.com">codysharp011@outlook.com</a></li>
<li><span>Instagram</span><a href="https://instagram.com/c0dyylifts" rel="noopener" target="_blank">@c0dyylifts</a></li>
<li><span>Venmo</span><a href="https://venmo.com/u/Cody-Sharp-72" rel="noopener" target="_blank">@Cody-Sharp-72</a></li>
<li><span>TikTok</span><a href="https://www.tiktok.com/@codyylifts" rel="noopener" target="_blank">@codyylifts</a></li>
</ul>
<button class="btn o" id="sh" type="button">Share this page</button>
</div>
</div></section>
</main>
<footer><div class="w">
<span style="display:flex;align-items:center;gap:10px"><img alt="" src="/images/sharp-fitness-logo-a24843b318e0.png"/>Sharp Fitness</span>
<span>Cody Sharp · Master Coach, NASM and ISSA · San Diego, CA</span>
</div></footer>
<nav aria-label="Quick contact" class="dock"><a href="tel:+16196421150">Call</a><a href="sms:+16196421150">Text</a><a href="#contact">Book</a></nav>

`;
export default function HomePage() {
  useEffect(() => {
    const form=document.getElementById('f');
    const share=document.getElementById('sh');
    const onSubmit=async(e)=>{
      e.preventDefault();
      const d=new FormData(e.target);
      const ok=document.getElementById('ok');
      const button=e.target.querySelector('button[type=\"submit\"]');
      if(button){button.disabled=true;button.textContent='Sending...';}
      if(ok){ok.hidden=false;ok.textContent='Sending your request...';}
      try{
        const res=await fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:d.get('n'),contact:d.get('c'),goal:d.get('g'),interestedIn:d.get('p'),message:d.get('m')})});
        const data=await res.json().catch(()=>({}));
        if(!res.ok)throw new Error(data.message||'Could not send request.');
        if(ok)ok.textContent=data.message||'Thanks — Cody received your request.';
        e.target.reset();
      }catch(err){
        if(ok)ok.textContent=err.message+' You can also call or text 619-642-1150.';
      }finally{
        if(button){button.disabled=false;button.textContent='Send my request';}
      }
    };
    const onShare=()=>{const u=location.href;if(navigator.share)navigator.share({title:document.title,url:u}).catch(()=>{});else if(navigator.clipboard)navigator.clipboard.writeText(u).then(()=>{if(share)share.textContent='Link copied'});};
    form?.addEventListener('submit',onSubmit); share?.addEventListener('click',onShare);
    return ()=>{form?.removeEventListener('submit',onSubmit);share?.removeEventListener('click',onShare);};
  },[]);
  return <div dangerouslySetInnerHTML={{__html:markup}} />;
}
