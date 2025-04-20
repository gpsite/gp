import {
    animate,
    createTimer,
    createDraggable,
    createAnimatable,
    utils,
} from './external/anime.esm.min.js';

const $carousel = document.querySelector('.carousel'); // Ensure the selector matches the HTML
if ($carousel) {
    $carousel.innerHTML += $carousel.innerHTML; // Clone the children for creating the illusion of infinity
    const carouselItems = Array.from($carousel.children); // Use children to get all items

    const getTotalWidth = (total, $el) => {
        const style = getComputedStyle($el);
        const marginsWidth = parseInt(style.marginLeft) + parseInt(style.marginRight);
        return total + $el.offsetWidth + marginsWidth;
    };

    const carousel = { width: carouselItems.reduce(getTotalWidth, 0), speedX: 2, wheelX: 0, wheelY: 0 };

    const animatable = createAnimatable($carousel, {
        x: 0,
        modifier: v => utils.wrap(v, -carousel.width / 2, 0),
    });

    const { x } = animatable;

    const draggable = createDraggable(carousel, {
        trigger: '#infinite-carousel',
        y: false,
        onGrab: () => animate(carousel, { speedX: 0, duration: 500 }),
        onRelease: () => animate(carousel, { speedX: 2, duration: 500 }),
        onResize: () => (carousel.width = carouselItems.reduce(getTotalWidth, 0)),
        releaseStiffness: 20,
    });

    createTimer({
        onUpdate: () => {
            x(x() - carousel.speedX + draggable.deltaX - carousel.wheelX - carousel.wheelY);
        },
    });

    const wheelDeltaAnim = animate(carousel, {
        wheelY: 0,
        wheelX: 0,
        duration: 500,
        autoplay: false,
        ease: 'out(4)',
    });

    function onWheel(e) {
        e.preventDefault();
        carousel.wheelY = utils.lerp(carousel.wheelY, e.deltaY, 0.2);
        carousel.wheelX = utils.lerp(carousel.wheelX, e.deltaX, 0.2);
        wheelDeltaAnim.refresh().restart();
    }

    $carousel.addEventListener('wheel', onWheel, { passive: false });
} else {
    console.error('Carousel element not found.');
}
