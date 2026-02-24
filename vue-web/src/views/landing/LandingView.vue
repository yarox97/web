<script setup>
  import { onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { useAuthStore } from '@/stores/authStore' // Импортируем ваш стор
  import headerBg from '@/views/landing/img/header/bg.jpg' 

  const router = useRouter();
  const authStore = useAuthStore();

  // Проверяем статус при загрузке лендинга
  onMounted(async () => {

  });

  const goToLogin = () => {
    router.push({name: 'login'})
  }

  const goToRegister = () => {
    router.push({name: 'register'})
  }
</script>

<template>
   <input type="checkbox" id="nav-toggle" aria-label="Toggle navigation" />
   
   <nav class="nav">
      <div class="nav__container">
         <div class="nav__logo">VolleyMS</div>
         <ul class="nav__list">
            <li class="nav__item"><a href="#about">About us</a></li>
            <li class="nav__item"><a href="#pricing">Pricing</a></li>
            <li class="nav__item"><a href="#contact">Contact</a></li>
            <li class="nav__item mobile-only"><a class="blue" @click="goToLogin">Login</a></li>
         </ul>
         <button class="nav__btn" @click="goToLogin">Login</button>
      </div>
   </nav>
   
   <label for="nav-toggle" class="overlay"></label>
   
   <header class="header">
      <div class="header__bg" :style="{ backgroundImage: `url(${headerBg})` }"></div>
      <div class="header__content container">
         <div class="header__text-block">
             <h1 class="header__title">Reach your <span>sport</span><br>goals more<br>efficient</h1>
             <div class="header__desc">The leading sports club management software trusted by thousands of clubs worldwide.<br>From large multi-sport associations to local teams — manage memberships, attendance, payments, and communication with VolleyMS.</div>
         </div>
      </div>
      
      <label for="nav-toggle" class="burger" role="button" aria-label="Open navigation">
         <div class="burger__item"></div>
         <div class="burger__item"></div>
         <div class="burger__item"></div>
      </label>
   </header>
   
   <div class="container main-content">
      
      <section class="creating" id="about">
         <div class="creating__info">
            <div class="creating__subtitle subtitle blue">A fully integrated IT solution</div>
            <h2 class="creating__title title">Manage your Volleyball Club<br>like a <span class="blue italic">Pro</span></h2>
            <div class="creating__text">With VolleyMS, you can bring payments, scheduling, and team chat into one simple app. Say goodbye to messy spreadsheets and endless message threads.<br><br>We automate the daily admin work so you can focus on the game. Keep your coaches, players, and parents organized and ready to win.</div>
            <button class="creating__btn" @click="goToRegister">Create profile</button>
         </div>
         <div class="creating__visual">
             <div class="creating__img"></div> </div>
      </section>

      <section class="offer" id="pricing">
         <div class="offer__header">
            <div class="offer__subtitle subtitle blue">What do we offer</div>
            <h2 class="offer__title title"><span class="blue italic">Intuitive</span> volleyball club <br> management system</h2>
         </div>
         
         <div class="offer__items">
            <div class="offer__card">
               <div class="card__icon card__icon--1"></div>
               <div class="card__content">
                   <div class="card__name blue">Get closer to your members</div>
                   <div class="card__text">Centralize all club interactions in one place. From urgent updates to event coordination, keep players, coaches, and staff aligned without the chaos of multiple chat apps.</div>
               </div>
            </div>
            <div class="offer__card">
               <div class="card__icon card__icon--2"></div>
               <div class="card__content">
                   <div class="card__name blue">Economy on autopilot</div>
                   <div class="card__text">Say goodbye to spreadsheets and awkward reminders. Our automated system handles invoicing and tracking, giving you complete visibility over your club’s economy.</div>
               </div>
            </div>
            <div class="offer__card">
               <div class="card__icon card__icon--3"></div>
               <div class="card__content">
                   <div class="card__name blue">Flexible calendar</div>
                   <div class="card__text">A dynamic calendar designed for sports clubs. Manage practices, matches, and events across all teams, ensuring no misunderstandings.</div>
               </div>
            </div>
            <div class="offer__card">
               <div class="card__icon card__icon--4"></div>
               <div class="card__content">
                   <div class="card__name blue">Unlock potential</div>
                   <div class="card__text">Keep the dialogue alive between practices. Assign challenges or theory homework. Players can ask questions and discuss results in the task comments.</div>
               </div>
            </div>
         </div>
      </section>
   </div>
</template>

<style scoped lang="scss">
// ======================== FONTS & RESETS ===============================
@import url('https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Quicksand:wght@300..700&display=swap');

:global(*) {
  padding: 0;
  margin: 0;
  border: 0;
  box-sizing: border-box;
}

:global(html), :global(body) {
   height: 100%;
   width: 100%;
   font-size: 16px; 
   line-height: 1.5; // Улучшена читаемость
   font-family: 'Inter', sans-serif;
   color: #262626;
   background-color: #ffffff;
   scroll-behavior: smooth;
}

:global(ul li) { list-style: none; }
:global(a) { text-decoration: none; color: inherit; cursor: pointer; }
:global(button) { cursor: pointer; font-family: inherit; }

// ======================== UTILS =============================

.blue { color: #4B9BD4; }
.italic { font-style: italic; }

.container {
   max-width: 1200px;
   margin: 0 auto;
   padding: 0 20px;
}

.subtitle {
   font-size: 18px;
   font-weight: 600;
   letter-spacing: -0.5px;
   text-transform: uppercase;
   margin-bottom: 10px;
}

.title {
   font-size: 28px;
   font-weight: 800;
   line-height: 1.2;
   color: #3f3f3f;
   margin-bottom: 20px;
}

// ========================= NAVIGATION ==============================

#nav-toggle { display: none; }

.nav {
   position: fixed;
   top: 0;
   left: 0;
   width: 100%;
   background: #fff;
   z-index: 50;
   padding: 80px 20px 40px; // Отступ сверху для мобилки
   transform: translateY(-100%);
   transition: transform 0.3s ease-in-out;
   box-shadow: 0 4px 10px rgba(0,0,0,0.1);

   &__container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 30px;
   }

   &__logo {
      font-size: 24px;
      font-weight: 700;
      color: #262626;
   }

   &__list {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
   }

   &__item {
      font-size: 20px;
      font-weight: 600;
      
      a:hover { color: #4B9BD4; transition: 0.3s; }
   }

   &__btn {
      display: none; // Скрыта на мобильных, есть ссылка в списке
   }
}

.overlay {
   position: fixed;
   inset: 0;
   background: rgba(0, 0, 0, 0.5);
   opacity: 0;
   pointer-events: none;
   z-index: 40;
   transition: opacity 0.3s;
}

#nav-toggle:checked ~ .overlay {
   opacity: 1;
   pointer-events: all;
}

#nav-toggle:checked ~ .nav {
   transform: translateY(0);
}

// Бургер кнопка
.burger {
   position: absolute;
   top: 20px;
   right: 20px;
   width: 45px;
   height: 45px;
   background-color: rgba(255, 255, 255, 0.2);
   border-radius: 12px;
   display: flex;
   flex-direction: column;
   align-items: center;
   justify-content: center;
   gap: 6px;
   cursor: pointer;
   z-index: 60; // Поверх навбара

   &__item {
      width: 24px;
      height: 3px;
      border-radius: 2px;
      background-color: #fff;
      transition: 0.3s;
   }

   &:hover { background-color: rgba(255, 255, 255, 0.4); }
}

// ========================= HEADER ==============================

.header {
   position: relative;
   height: 100vh;
   min-height: 500px;
   max-height: 800px;
   display: flex;
   align-items: center;
   margin-bottom: 60px;
   
   &__bg {
      position: absolute;
      inset: 0;
      background-size: cover;
      background-position: center;
      z-index: 0;

      &::before {
         content: "";
         position: absolute;
         inset: 0;
         background: rgba(1, 30, 56, 0.5); // Затемнение
      }
   }

   &__content {
      width: 100%;
      position: relative;
      z-index: 1;
   }

   &__text-block {
      max-width: 600px;
   }

   &__title {
      font-size: clamp(32px, 5vw, 60px); // Адаптивный шрифт
      font-weight: 900;
      color: #ffffff;
      line-height: 1.1;
      margin-bottom: 20px;
      
      span { color: #4B9BD4; }
   }

   &__desc {
      color: #f0f0f0;
      font-size: 16px;
      line-height: 1.6;
      max-width: 500px;
   }
}

// ====================== CREATING SECTION =============================

.main-content {
   display: flex;
   flex-direction: column;
   gap: 80px;
   padding-bottom: 60px;
}

.creating {
   display: flex;
   flex-direction: column;
   gap: 40px;

   &__info {
      flex: 1;
   }

   &__text {
      font-size: 16px;
      color: #555;
      margin-bottom: 30px;
   }

   &__btn {
      font-size: 16px;
      font-weight: 600;
      color: #ffffff;
      background-color: #4B9BD4;
      border-radius: 30px;
      padding: 14px 32px;
      transition: background-color 0.3s ease;
      
      &:hover { background-color: #3580b6; }
   }

   &__visual {
      flex: 1;
   }

   &__img {
      width: 100%;
      height: 300px;
      background-color: #D9D9D9;
      border-radius: 20px;
      object-fit: cover;
   }
}

// ====================== OFFER SECTION =============================

.offer {
   &__header {
      margin-bottom: 40px;
   }

   &__items {
      display: grid;
      grid-template-columns: 1fr;
      gap: 30px;
   }
}

.offer__card {
   display: flex;
   align-items: flex-start;
   gap: 20px;

   .card__icon {
      flex-shrink: 0;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background-color: #f0f7fc;
      background-size: 24px;
      background-position: center;
      background-repeat: no-repeat;

      &--1 { background-image: url('@/views/landing/img/offer/icon1.svg'); }
      &--2 { background-image: url('@/views/landing/img/offer/icon2.svg'); }
      &--3 { background-image: url('@/views/landing/img/offer/icon3.svg'); }
      &--4 { background-image: url('@/views/landing/img/offer/icon4.svg'); }
   }

   .card__content {
      flex: 1;
   }

   .card__name {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 8px;
   }

   .card__text {
      font-size: 15px;
      color: #666;
   }
}

// ========================= DESKTOP (MEDIA QUERIES) ==============================

@media (min-width: 1024px) {
   // Навигация
   .burger { display: none; }
   
   .nav {
      position: absolute;
      transform: translateY(0);
      background: transparent;
      box-shadow: none;
      padding: 30px 0;
      height: auto;
      
      &__container {
         flex-direction: row;
         justify-content: space-between;
         max-width: 1200px;
         margin: 0 auto;
         padding: 0 20px;
         width: 100%;
      }

      &__logo {
         color: #fff;
         font-size: 26px;
      }

      &__list {
         flex-direction: row;
         gap: 40px;
      }

      &__item {
         font-size: 16px;
         font-weight: 500;
         color: rgba(255,255,255,0.9);
         
         &.mobile-only { display: none; }
         
         a:hover { color: #fff; text-decoration: underline; }
      }

      &__btn {
         display: block;
         background: rgba(255,255,255,0.2);
         border: 1px solid rgba(255,255,255,0.5);
         color: #fff;
         padding: 10px 24px;
         border-radius: 20px;
         font-weight: 600;
         transition: 0.3s;
         
         &:hover { background: #fff; color: #4B9BD4; }
      }
   }

   // Хедер
   .header {
      &__text-block {
         max-width: 700px;
      }
   }

   // Creating Section (Две колонки)
   .creating {
      flex-direction: row;
      align-items: center;
      gap: 60px;

      &__img {
         height: 450px;
      }
   }

   // Offer Section (Сетка 2 колонки)
   .offer {
      &__items {
         grid-template-columns: repeat(2, 1fr);
         column-gap: 60px;
         row-gap: 50px;
      }
   }
}
</style>