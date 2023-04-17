// ==UserScript==
// @name         gelbooru quick image viewer
// @namespace    https://github.com/MRGRD56
// @version      0.2
// @author       MRGRD56
// @match        https://gelbooru.com/index.php
// @match        https://gelbooru.com/index.php*
// @icon         https://gelbooru.com/favicon.png
// @grant        GM_getResourceText
// @grant        GM_addStyle
// @require      https://cdnjs.cloudflare.com/ajax/libs/viewerjs/1.11.2/viewer.min.js
// @resource     VIEWER_CSS https://cdnjs.cloudflare.com/ajax/libs/viewerjs/1.11.2/viewer.min.css
// ==/UserScript==

(function() {
    'use strict';

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('page') !== 'post' || urlParams.get('s') !== 'list') {
        return;
    }

    const getFullImageUrlSample = (inputUrl) => {
        return inputUrl.replace(/thumbnails\/(\w+)\/(\w+)\/thumbnail_(\w+)\.jpg/, 'samples/$1/$2/sample_$3.jpg');
    };

    const getFullImageUrlImage = (inputUrl) => {
        return inputUrl.replace(/thumbnails\/(\w+)\/(\w+)\/thumbnail_(\w+)\.jpg/, 'images/$1/$2/$3.jpg');
    };

    const replaceExtension = (extension) => {
        return {
            'jpg': 'jpeg',
            'jpeg': 'png',
            'png': 'webp'
        }[extension] || extension;
    };

    const replaceFullImageUrlExtension = (inputUrl) => {
        return inputUrl.replace(/\.(\w{2,})$/, (match, extension) => '.' + replaceExtension(extension));
    };

    const postListPosts = document.querySelector('main .thumbnail-container');

    const viewHandler = (e, o) => {
        console.log('VIEW', e, o);

        const originalImage = e.detail.originalImage;
        const viewedImage = e.detail.image;

        const errorHandler = () => {
            viewedImage.removeEventListener('load', loadHandler);
            viewedImage.removeEventListener('error', errorHandler);

            originalImage.removeAttribute('data-image-loaded');

            if (originalImage.getAttribute('data-is-full-image') === 'true') {
                const oldLink = originalImage.src;
                const newLink = replaceFullImageUrlExtension(originalImage.getAttribute('data-full'));

                if (newLink === oldLink) {
                    return;
                }

                originalImage.setAttribute('data-full', newLink);
                viewedImage.src = newLink;
            } else {
                const oldLink = originalImage.src;
                const newLink = getFullImageUrlImage(originalImage.src);

                if (newLink === oldLink) {
                    return;
                }

                originalImage.setAttribute('data-full', newLink);
                originalImage.setAttribute('data-is-full-image', 'true');
                viewedImage.src = newLink;
            }

            viewHandler(e, o);
        };

        const loadHandler = () => {
            viewedImage.removeEventListener('load', loadHandler);
            viewedImage.removeEventListener('error', errorHandler);

            originalImage.setAttribute('data-image-loaded', 'true');
        };

        viewedImage.addEventListener('error', errorHandler);
        viewedImage.addEventListener('load', loadHandler);
    };

    const viewer = new Viewer(postListPosts, {
        url(image) {
            let originalUrl = image.getAttribute('data-full');

            if (!originalUrl) {
                originalUrl = getFullImageUrlSample(image.src);
                image.setAttribute('data-full', originalUrl);
            }

            return originalUrl;
        },
        filter(image) {
            return image.matches('[title]');
        },
        transition: false,
        view(e, o) {
            if (e.detail.originalImage.getAttribute('data-image-loaded') !== 'true') {
                viewHandler(e, o);
            }
        }
    });

    for (const thumb of postListPosts.querySelectorAll('.thumbnail-preview a')) {
        thumb.addEventListener('click', (event) => {
            event.preventDefault();
        });
    }

    GM_addStyle(GM_getResourceText('VIEWER_CSS'));
})();
