/**
 * Include your custom JavaScript here.
 *
 * We also offer some hooks so you can plug your own logic. For instance, if you want to be notified when the variant
 * changes on product page, you can attach a listener to the document:
 *
 * document.addEventListener('variant:changed', function(event) {
 *   var variant = event.detail.variant; // Gives you access to the whole variant details
 * });
 *
 * You can also add a listener whenever a product is added to the cart:
 *
 * document.addEventListener('product:added', function(event) {
 *   var variant = event.detail.variant; // Get the variant that was added
 *   var quantity = event.detail.quantity; // Get the quantity that was added
 * });
 *
 * If you just want to force refresh the mini-cart without adding a specific product, you can trigger the event
 * "cart:refresh" in a similar way (in that case, passing the quantity is not necessary):
 *
 * document.documentElement.dispatchEvent(new CustomEvent('cart:refresh', {
 *   bubbles: true
 * }));
 */

(function() {
    document.addEventListener('variant:changed', function(event) {
        const detailElements = document.querySelectorAll('.ProductForm__Details');
        if (event.detail.variant.available) {
            detailElements.forEach(element => {
                element.hidden = false;
                element.querySelector('span').innerText = window.languages.productFormInStock;
            });
        } else {
            detailElements.forEach(element => {
                element.hidden = true;
            });
        }
    });
})();

(function() {
    function addDynamicListener(event, selector, callback) {
        document.documentElement.addEventListener(event, function(event) {
            if (event.target.matches(selector) || event.target.closest(selector)) {
                callback(event);
            }
        });
    }

    addDynamicListener('click', '[data-pw-terms-accepted]', function(event) {
        const checkbox = document.querySelector('[data-pw-accept-terms]');
        if (!checkbox || checkbox.checked) return;
        event.preventDefault();
        alert(window.languages.cartAcceptTerms);
    });

    // Gift wrap listener
    addDynamicListener('click', '.NullsgifDiv', function(event) {
        if (event.target.id === 'NullsgiftWrap') return;
        checkMe();
    });
})();

/**
 * In-cart discounts.
 */
function tbn_carter_after_code_applied(data) {
  console.log(data)
    if (!data.error) {
        const price = document.querySelector('[data-pw-terms-accepted] [data-money-convertible]');
        if (price) {
            price.dataset.savedPrice = data.evaluated_deal.parsed.estimated_total_format;
            price.innerText = data.evaluated_deal.parsed.total_amount;
        }

        const priceCart = document.querySelector('.Cart__Footer .Cart__Total [data-money-convertible]');
        if (priceCart) {
            priceCart.dataset.savedPrice = data.evaluated_deal.parsed.estimated_total_format;
            priceCart.innerText = data.evaluated_deal.parsed.total_amount;
        }
    } else {
        const price = document.querySelector('[data-pw-terms-accepted] [data-money-convertible]');
        if (price && price.dataset.savedPrice) {
            price.innerText = price.dataset.savedPrice;
        }

        const priceCart = document.querySelector('.Cart__Footer .Cart__Total [data-money-convertible]');
        if (priceCart && priceCart.dataset.savedPrice) {
            priceCart.innerText = priceCart.dataset.savedPrice;
        }
    }
}



// DTAILS DEV


document.addEventListener('variant:changed', function(event) {
    var $Product = $('section.Product')
    $addtoCart = $('.ProductForm__AddToCart', $Product)
    $wholeSaleDisabledMessage = $('.ProductForm__WholeSaleDisabledMessage', $Product)
    $frameModule = $('.frame-module', $Product)

    var $Product = $('section.Product')

    var variant = event.detail.variant; // Gives you access to the whole variant details
    $addtoCart.show()
    $frameModule.find('.ProductForm__Item').attr('disabled', null)
    $wholeSaleDisabledMessage.hide()
});

var FramesModule = {
    init: function() {
        this.$container = $('.frame-module')
        this.$frameImage = $('[data-frame-image]', this.$container)
        this.$frameSelector = $('.OptionSelector [data-action="select-value"]', this.$container)
        this.$frameDropdown = $('.ProductForm__Item', this.$container)
        this.$frameValues = $('.OptionSelector .Popover__ValueList', this.$container)
        this.$frameImage = $('[data-frame-image]')
        this.$propBundle = $('input[name="properties[_bundle]"]')
        this.$addtoCart = $('.ProductForm__AddToCart', this.$container)
        this.$wholeSaleDisabledMessage = $('.ProductForm__WholeSaleDisabledMessage', this.$container)

        var $Product = $('section.Product')

        var self = this

        this.frames_json = JSON.parse($('[data-frames-json]', this.$container).html())
        if (!this.frames_json) {
            return
        }

        this.active_frame = null
        this.active_frame_variant = null
        this.poster_variant = this.frames_json.poster_variant
        this.poster_size = this.frames_json.poster_size
        this.has_only_default_variant = this.frames_json.has_only_default_variant
        this.orientation = this.frames_json.orientation
        this.imagesLoaded = false

        document.addEventListener('variant:changed', function(event) {
            // Exit if event is triggered by frame selector
            if (event.detail.previousVariant.id == event.detail.variant.id) {
                self.setTotalPrice()
                return
            }
            var variant = event.detail.variant; // Gives you access to the whole variant details
            self.poster_variant = variant
            var frame_id = self.active_frame ? self.active_frame.id : null
            self.setActiveFrame(frame_id)
            self.setFramePrices()
        });

        this.$frameDropdown.on('click', function() {
            self.preloadImages()
        })

        this.$frameSelector.on('click', function(e) {
            var frame_id = $(this).data('frame-id')
            var value = $(this).data('value')
            self.setActiveFrame(frame_id)
            self.setFrameImage()
            self.setTotalPrice()
        })


        document.addEventListener('product:added', function(event) {
            if (event.detail.is_frame) {
                return
            }
            if (self.active_frame_variant) {
                var quantity = parseInt($('.ProductForm .QuantitySelector__CurrentQuantity').val())
                var bundle_id = Math.ceil(Math.random() * 100000)
                var changeData = JSON.stringify({
                    "id": event.detail.key || event.detail.variant.id,
                    "quantity": quantity,
                    "properties": {
                        "_bundle_id": bundle_id
                    }
                });
                fetch('/cart/change.js', {
                    body: changeData,
                    credentials: 'same-origin',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest' // This is needed as currently there is a bug in Shopify that assumes this header
                    }
                }).then(function(cart) {
                    if (!cart.ok) {
                        cart.json().then(function(resp){
                            console.error(resp);
                        });
                    }
                    fetch('/cart/add.js', {
                        body: JSON.stringify({
                            "quantity": quantity,
                            "id": self.active_frame_variant.id,
                            properties: {
                                "_bundle_id": bundle_id
                            }
                        }),
                        credentials: 'same-origin',
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest' // This is needed as currently there is a bug in Shopify that assumes this header
                        }
                    }).then(function(response) {
                        document.dispatchEvent(new CustomEvent('product:added', {
                            bubbles: false,
                            detail: {
                                variant: self.active_frame_variant.id,
                                quantity: quantity,
                                is_frame: true
                            }
                        }))
                    })

                });
            }
        });

    },
    setActiveFrame: function(frame_id) {
        var self = this
        if (!frame_id) {
            self.active_frame = null
            self.active_frame_variant = null
            self.$propBundle.val(false)
            return
        }
        self.active_frame = self.findFrame(frame_id)
        self.active_frame_variant = self.findFrameVariant(self.poster_variant.title, self.active_frame.variants)
        self.$propBundle.val(true)
    },
    findFrame: function(frame_id) {
        var self = this
        var frame = $.grep(self.frames_json.frames, function(f, i) {
            return f.id == frame_id;
        });
        return frame[0]
    },
    findFrameVariant: function(size, variants) {
        var self = this
        size = this.has_only_default_variant ? this.poster_size : size
        var variant = $.grep(variants, function(f, i) {
            return f.size == size && f.available
        })
        return variant[0]
    },
    setFramePrices: function() {
        var self = this
        self.$frameSelector.each(function() {
            var $this = $(this)
            if ($this.data('is-frame')) {
                var frame_id = $this.data('frame-id')
                var frame = self.findFrame(frame_id)
                var frame_variant = self.findFrameVariant(self.poster_variant.title, frame.variants)
                var price = ''
                if (frame_variant) {
                    price = self.Currency.formatMoney(self.calculatePrice(frame_variant.price), window.theme.moneyFormat)
                        //console.log('frame size found:', frame.title)
                    $this.css({ 'display': 'block' })
                } else {
                    $this.css({ 'display': 'none' })
                }

                var value = frame.title.replace('Ramme - ', '') + ' + ' + price
                $this.html(value)
                $this.attr('data-value', value)
            }
        })
        var $selected = self.$frameSelector.filter('.is-selected')
        if (!$selected.is(':visible')) {
            $selected = self.$frameSelector.last()
            self.active_frame = null
            self.setFrameImage()
        }
        $('.ProductForm__SelectedValue', self.$container).html($selected.attr('data-value'))

        this.setTotalPrice()
    },
    setTotalPrice: function() {
        var poster_variant_price = this.poster_variant.price
        var price_total = this.active_frame_variant ?
            this.calculatePrice(poster_variant_price) + this.calculatePrice(this.active_frame_variant.price) :
            this.calculatePrice(poster_variant_price)
        var price_total_html = this.Currency.formatMoney(price_total, window.theme.moneyFormat)
        var price_member_total_html = this.Currency.formatMoney(price_total * 0.9, window.theme.moneyFormat)
        $('.ProductMeta__Price').html(price_total_html)
        $('.ProductMeta__MembershipPrice [data-money-convertible]').html(price_member_total_html)
        if (this.poster_variant.compare_at_price > this.poster_variant.price) {
            var compare_price_total = this.active_frame_variant ?
                this.calculatePrice(this.poster_variant.compare_at_price) + this.calculatePrice(this.active_frame_variant.price) :
                this.calculatePrice(this.poster_variant.compare_at_price)
            var compare_price_total_html = this.Currency.formatMoney(compare_price_total, window.theme.moneyFormat)
            $('.ProductMeta__Price.Price--compareAt').html(compare_price_total_html)
        }
        $('.ProductForm__AddToCart').find('[data-money-convertible]').html(price_total_html)
    },
    setFrameImage: function() {
        this.$frameImage.removeClass('frame-module__image--visible ')
        if (!this.active_frame) {
            this.$frameImage.css('background-image', '')
            return
        }
        var img_src = this.active_frame.image ? this.active_frame.image : this.active_frame_variant.image
        if (!img_src) return
        var self = this
        setTimeout(function() {
            self.$frameImage.css('background-image', 'url(' + img_src + ')').addClass('frame-module__image--visible ')
        }, 300)
    },
    preloadImages: function() {
        if (this.imagesLoaded) {
            return
        }
        var images = []
        for (var i = 0; i < this.frames_json.frames.length; i++) {
            images[i] = new Image();
            images[i].src = this.frames_json.frames[i].image;
        }
        this.imagesLoaded = true
    },
    addPhotoSwipeInstance: function(instance) {
        if (!this.active_frame_variant) {
            return
        }
        this.photoSwipeInstance = instance
        var self = this
        this.photoSwipeInstance.listen('imageLoadComplete', function(index, item) {
            self.onPhotoSwipeLoad(index, item)
        });
        this.photoSwipeInstance.listen('zoomGestureEnded', function(index, item) {
            self.togglePhotoSwipeZoom()
        });
        this.photoSwipeInstance.listen('doubleTap', function(index, item) {
            self.togglePhotoSwipeZoom()
        });
        this.photoSwipeInstance.listen('destroy', function(index, item) {
            self.$framePhotoSwipeImage.remove()
            document.removeEventListener('pswpTap', onSingleTap)
        });

        document.addEventListener('pswpTap', onSingleTap)

        function onSingleTap(event) {
            if (!event.detail || event.detail.pointerType === 'mouse') {
                if (event.target.classList.contains('pswp__img')) {
                    self.togglePhotoSwipeZoom()
                }
            }
        }
    },
    onPhotoSwipeLoad: function(index, item) {
        var $photoswipe = $('.pswp__zoom-wrap').first()
        var $newImage = this.$frameImage.clone()
        this.$framePhotoSwipeImage = $newImage
        var $photoswipeImg = $('.pswp__img')
        $newImage.css({ width: $photoswipeImg.css('width'), height: $photoswipeImg.css('height') })
        this.framePhotoSwipeImage = {
            w: item.w,
            h: item.h
        }
        $photoswipe.append($newImage)
    },
    togglePhotoSwipeZoom: function(event) {
        var self = this
        if (self.$framePhotoSwipeImage.width() == self.framePhotoSwipeImage.w) {
            return
        }
        self.$framePhotoSwipeImage.hide()
        setTimeout(function() {
            self.$framePhotoSwipeImage.css({
                width: self.framePhotoSwipeImage.w + 'px',
                height: self.framePhotoSwipeImage.h + 'px'
            })
            self.$framePhotoSwipeImage.show()
        }, 500)
    },
    calculatePrice: function(price) {
        return price
    }
}

FramesModule.Currency = (function() {
    var moneyFormat = '${{amount}}';

    /**
     * Format money values based on your shop currency settings
     * @param  {Number|string} cents - value in cents or dollar amount e.g. 300 cents
     * or 3.00 dollars
     * @param  {String} format - shop money_format setting
     * @return {String} value - formatted value
     */
    function formatMoney(cents, format) {
        if (typeof cents === 'string') {
            cents = cents.replace('.', '');
        }
        var value = '';
        var placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
        var formatString = (format || moneyFormat);

        function formatWithDelimiters(number, precision, thousands, decimal) {
            precision = FramesModule.defaultTo(precision, 2);
            thousands = FramesModule.defaultTo(thousands, ',');
            decimal = FramesModule.defaultTo(decimal, '.');

            if (isNaN(number) || number == null) {
                return 0;
            }

            number = (number / 100.0).toFixed(precision);

            var parts = number.split('.');
            var dollarsAmount = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands);
            var centsAmount = parts[1] ? (decimal + parts[1]) : '';

            return dollarsAmount + centsAmount;
        }

        switch (formatString.match(placeholderRegex)[1]) {
            case 'amount':
                value = formatWithDelimiters(cents, 2);
                break;
            case 'amount_no_decimals':
                value = formatWithDelimiters(cents, 0);
                break;
            case 'amount_with_space_separator':
                value = formatWithDelimiters(cents, 2, ' ', '.');
                break;
            case 'amount_with_comma_separator':
                value = formatWithDelimiters(cents, 2, '.', ',');
                break;
            case 'amount_no_decimals_with_comma_separator':
                value = formatWithDelimiters(cents, 0, '.');
                break;
            case 'amount_no_decimals_with_space_separator':
                value = formatWithDelimiters(cents, 0, ' ');
                break;
        }

        return formatString.replace(placeholderRegex, value);
    }

    return {
        formatMoney: formatMoney
    };
})();

FramesModule.defaultTo = function(value, defaultValue) {
    return (value == null || value !== value) ? defaultValue : value
}

$(document).ready(function() {
    if ($('.frame-module').length > 0) {
        FramesModule.init()
    }
});

(function() {
  /* custom currencies popup */
  document.querySelectorAll('.localization-toggle').forEach(function(toggle) {
    toggle.addEventListener('click', function() {
      this.classList.toggle('active');
      this.nextElementSibling.classList.toggle('active');
    });
  });

  $(document).mouseup(function(e) {
      var container = $('.localization-selectors');
      // if the target of the click isn't the container nor a descendant of the container
      if (!container.is(e.target) && container.has(e.target).length === 0) {
        $('.localization-toggle').removeClass('active');
        $('.localization-selectors .popover').removeClass('active');
      }
  });
  /* END currencies popup */
})();