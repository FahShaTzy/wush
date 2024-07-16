window.onscroll = function() {

    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = ( winScroll / height ) * 100;
    document.getElementById( 'bar-progress' ).style.width = scrolled + '%';

}

const navbarNav = document.getElementById( 'navbar-nav' );

document.getElementById( 'menu' ).onclick = () => {

    navbarNav.classList.toggle( 'active' );

};

document.addEventListener( 'click', event => {

    if ( ! document.getElementById( 'menu' ).contains( event.target ) && ! navbarNav.contains( event.target ) ) {

        navbarNav.classList.remove('active');

    }

} );


/* UNUSED, JUST DON'T HAPUS */

// const navbar = document.getElementById( 'navbar' );
// const navbarNav = document.getElementById( 'navbar-nav' );
// let isAdded = false;

// window.addEventListener( 'resize', () => {

//     if ( isAdded ) return;

//     if ( window.innerWidth <= 768 ) {

//         navbar.insertAdjacentHTML( 'beforeend', `
//             <div class="navbar-extra">
//                 <a href="#" id="menu">
//                     <i data-feather="menu"></i>
//                 </a>
//             </div>
//         ` );

//         document.getElementById( 'menu' ).onclick = () => {

//             navbarNav.classList.toggle( 'active' );

//         };

//         isAdded = true;

//     } else if ( navbar.hasChildNodes() ) {

//         navbar.remove();
//         isAdded = false;

//     }

// } );

// Toggle class active untuk search form
// const searchForm = document.querySelector('.search-form');
// const searchBox = document.querySelector('#search-box');

// document.querySelector('#search-button').onclick = (e) => {
//     searchForm.classList.toggle('active');
//     searchBox.focus();
//     e.preventDefault();
// };

// Toggle class active untuk shopping cart
// const shoppingCart = document.querySelector('.shopping-cart');
// document.querySelector('#shopping-cart-button').onclick = (e) => {
//   shoppingCart.classList.toggle('active');
//   e.preventDefault();
// };

// Klik di luar elemen
// const hm = document.querySelector('#hamburger-menu');
// const sb = document.querySelector('#search-button');
// const sc = document.querySelector('#shopping-cart-button');

// document.addEventListener('click', function (e) {
//   if (!hm.contains(e.target) && !navbarNav.contains(e.target)) {
//     navbarNav.classList.remove('active');
//   }

//   if (!sb.contains(e.target) && !searchForm.contains(e.target)) {
//     searchForm.classList.remove('active');
//   }

//   if (!sc.contains(e.target) && !shoppingCart.contains(e.target)) {
//     shoppingCart.classList.remove('active');
//   }
// });

// // Scroll Animation
// const observer = new IntersectionObserver((entries) => {
//   entries.forEach((entry) => {
//     console.log (entry)
//     if (entry.isIntersecting) {
//       entry.target.classList.add('show');
//     } else {
//       entry.target.classList.remove('show');
//     }
//   });
// });

// const hiddenElements = document.querySelectorAll('.about');
// hiddenElements.forEach((el) => observer.observe(el));