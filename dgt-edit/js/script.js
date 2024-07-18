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

fetch( 'https://alex21321312.github.io/devilgama-technology/index.html' )
    .then( r => r.text() )
    .then( t => {

        const html = new DOMParser().parseFromString( t, 'text/html' );

        const about = html.querySelector( 'div.content' ).children;
        for ( i = 0; i < about.length; i -= - 1 ) document.getElementsByClassName( 'fetch1' )[ i ].textContent = about[ i ].textContent;

        html.querySelectorAll( '.product-content' ).forEach( function ( node, index ) {

            document.getElementsByClassName( 'product-content' )[ index ].children[ 1 ].textContent = node.textContent;
            // console.log(node.textContent);

        } );

        html.querySelectorAll( '.product-image' ).forEach( function ( node, index ) {

            document.getElementsByClassName( 'product-image' )[ index ].children[ 0 ].src =
                ( node.children[ 0 ].src ).replace(
                    'file:///C:/Users/fahri/Documents/dgt-edit/img/',
                    'https://alex21321312.github.io/devilgama-technology/img/'
                );

        } )

} );


/* UNUSED, JUST DON'T HAPUS */

// const url = 'https://alex21321312.github.io/devilgama-technology/index.html';

// const blobToBase64 = async function ( blob ) {

//     return new Promise( resolve => {

//         const reader = new FileReader();
//         reader.onload = () => resolve( reader.result );
//         reader.readAsDataURL( blob );

//     } );

// }

// const fetchImage =  async function ( url ) {

//     const response = await fetch( url );
//     const blob = await response.blob();

//     return blob;

// }

// const downloadImage = async function ( url ) {

//     const imageBlob = await fetchImage( url );
//     const imageBase64 = URL.createObjectURL( imageBlob );

//     console.log({imageBase64});

//     const a = document.createElement( 'a' );
//     a.style.display = 'none';
//     document.body.appendChild( a );
//     a.download = url.replace( /^.*[\\\/]/, '' );
//     a.href = imageBase64;
//     a.click();
//     a.remove();

//     downloadImage = null;

// }

// document.addEventListener( 'click', () => { downloadImage( url ) } );

// const pemilos = html.querySelector( 'div.product-content').children;
// document.querySelector( 'div.product-content p' ).textContent = pemilos[ 1 ].textContent;

// const ksn = html.getElementsByClassName( 'product-content')[ 1 ].children;
// document.getElementsByClassName( 'product-content' )[ 1 ].children[ 1 ].textContent = ksn[ 1 ].textContent;

// const proyek = html.getElementsByClassName( 'product-content')[ 2 ].children;
// document.getElementsByClassName( 'product-content' )[ 2 ].children[ 1 ].textContent = proyek[ 1 ].textContent;

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