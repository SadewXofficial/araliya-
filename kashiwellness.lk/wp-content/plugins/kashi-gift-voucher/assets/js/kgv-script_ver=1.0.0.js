/* =====================================================
   Kashi Gift Voucher – Frontend Script
   ===================================================== */
jQuery(function ($) {
  const GIFT_BOX_PRICE = 2500;
  const COMPLIMENTARY_THRESHOLD = 14000;

  // State
  let formData = {};

  // Elements
  const $form            = $('#kgvPurchaseForm');
  const $voucherValue    = $('#kgv_value');
  const $giftBoxSection  = $('#kgvGiftBoxSection');
  const $giftBoxEligible = $('#kgvGiftBoxEligible');
  const $giftBoxLabel    = $('#kgvGiftBoxLabel');
  const $giftBoxDesc     = $('#kgvGiftBoxDesc');
  const $evoucherDel     = $('#kgvEVoucherDelivery');
  const $physicalDel     = $('#kgvPhysicalDelivery');
  const $instoreOpt      = $('#kgvInstoreOption');
  const $instoreInfo     = $('#kgvInstoreInfo');
  const $bankDetails     = $('#kgvBankDetails');
  const $bankAmount      = $('#kgvBankAmount');
  const $modal           = $('#kgvModal');
  const $error           = $('#kgvError');

  // ─── Reactivity ──────────────────────────────────────

  function getVoucherType()    { return $('input[name="voucher_type"]:checked').val(); }
  function getGiftBox()        { return $('input[name="gift_box"]:checked').val() === '1'; }
  function getDelivery()       { return $('input[name="delivery_method"]:checked').val(); }
  function getPayment()        { return $('input[name="payment_method"]:checked').val(); }
  function getValue()          { return parseFloat($voucherValue.val()) || 0; }
  function isComplimentary()   { return getValue() >= COMPLIMENTARY_THRESHOLD; }

  function calcTotal() {
    let total = getValue();
    if (getGiftBox() && !isComplimentary()) total += GIFT_BOX_PRICE;
    return total;
  }

  function updateUI() {
    const type     = getVoucherType();
    const value    = getValue();
    const delivery = getDelivery();
    const payment  = getPayment();

    // Voucher type sections
    if (type === 'evoucher') {
      $evoucherDel.removeClass('kgv-hidden');
      $physicalDel.addClass('kgv-hidden');
      $giftBoxSection.addClass('kgv-hidden');
      $instoreOpt.addClass('kgv-hidden');
      // Force online payment for e-voucher
      $('input[name="payment_method"][value="online"]').prop('checked', true);
    } else if (type === 'physical') {
      $evoucherDel.addClass('kgv-hidden');
      $physicalDel.removeClass('kgv-hidden');
      $giftBoxSection.removeClass('kgv-hidden');
      $instoreOpt.removeClass('kgv-hidden');

      // Complimentary gift box logic
      if (value >= COMPLIMENTARY_THRESHOLD) {
        $giftBoxEligible.removeClass('kgv-hidden');
        $giftBoxLabel.text('Gift Box + Scented Candle (Complimentary 🎁)');
        $giftBoxDesc.text('Included free with your order!');
      } else {
        $giftBoxEligible.addClass('kgv-hidden');
        $giftBoxLabel.text('Gift Box + Scented Candle');
        $giftBoxDesc.text('+LKR ' + GIFT_BOX_PRICE.toLocaleString() + ' add-on');
      }

      // Pickme flash = must pay online
      if (delivery === 'pickme') {
        $('input[name="payment_method"][value="online"]').prop('checked', true);
        $instoreOpt.addClass('kgv-hidden');
      } else {
        $instoreOpt.removeClass('kgv-hidden');
      }
    } else {
      $evoucherDel.addClass('kgv-hidden');
      $physicalDel.addClass('kgv-hidden');
      $giftBoxSection.addClass('kgv-hidden');
    }

    // Payment display
    const payMethod = getPayment();
    if (payMethod === 'instore') {
      $instoreInfo.removeClass('kgv-hidden');
      $bankDetails.addClass('kgv-hidden');
    } else if (payMethod === 'online') {
      $instoreInfo.addClass('kgv-hidden');
      $bankDetails.removeClass('kgv-hidden');
    } else {
      $instoreInfo.addClass('kgv-hidden');
      $bankDetails.addClass('kgv-hidden');
    }

    // Update totals
    updateSummary();
  }

  function updateSummary() {
    const value      = getValue();
    const giftBox    = getGiftBox();
    const type       = getVoucherType();
    const delivery   = getDelivery();
    const compli     = isComplimentary();
    const pickme     = (type === 'physical' && delivery === 'pickme');

    // Voucher value row
    $('#sumVoucherVal').text('LKR ' + value.toLocaleString());

    // Gift box row
    if (giftBox && type === 'physical') {
      $('#sumGiftBoxRow').removeClass('kgv-hidden');
      if (compli) {
        $('#sumGiftBoxVal').text('Complimentary 🎁');
      } else {
        $('#sumGiftBoxVal').text('LKR ' + GIFT_BOX_PRICE.toLocaleString());
      }
    } else {
      $('#sumGiftBoxRow').addClass('kgv-hidden');
    }

    // PickMe row
    if (pickme) {
      $('#sumPickmeRow').removeClass('kgv-hidden');
      $('#sumPickmeNote').removeClass('kgv-hidden');
    } else {
      $('#sumPickmeRow').addClass('kgv-hidden');
      $('#sumPickmeNote').addClass('kgv-hidden');
    }

    const total = calcTotal();
    const totalStr = 'LKR ' + total.toLocaleString() + (pickme ? ' + PickMe Flash fee' : '');
    $('#sumTotal').text(totalStr);
    $bankAmount.text('LKR ' + total.toLocaleString() + (pickme ? ' + PickMe Flash fee' : ''));
  }

  // Listen
  $('input[name="voucher_type"], input[name="gift_box"], input[name="delivery_method"], input[name="payment_method"]').on('change', updateUI);
  $voucherValue.on('input', updateUI);

  // ─── Build Summary Text ───────────────────────────────

  function buildSummaryText() {
    const type     = getVoucherType();
    const giftBox  = getGiftBox();
    const delivery = getDelivery();
    const payment  = getPayment();
    const value    = getValue();
    const total    = calcTotal();
    const compli   = isComplimentary();
    const pickme   = (type === 'physical' && delivery === 'pickme');

    const buyerName    = $('#kgv_buyer_name').val();
    const buyerWA      = $('#kgv_buyer_whatsapp').val();
    const buyerEmail   = $('#kgv_buyer_email').val();
    const recipient    = $('#kgv_recipient').val();
    const contactMeth  = $('input[name="contact_method"]:checked').val();

    let lines = [];
    lines.push('🎁 *GIFT VOUCHER PURCHASE REQUEST*');
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push('');
    lines.push('👤 *Buyer Details*');
    lines.push(`   Name: ${buyerName}`);
    if (buyerWA)    lines.push(`   WhatsApp: ${buyerWA}`);
    if (buyerEmail) lines.push(`   Email: ${buyerEmail}`);
    lines.push('');
    lines.push('🎀 *Gift Details*');
    lines.push(`   Gifting To: ${recipient}`);
    lines.push(`   Voucher Value: LKR ${value.toLocaleString()}`);
    lines.push(`   Voucher Type: ${type === 'evoucher' ? 'E-Voucher' : 'Physical Voucher'}`);

    if (type === 'physical') {
      if (giftBox) {
        lines.push(`   Gift Box + Scented Candle: ${compli ? 'Complimentary ✅' : 'Yes (+LKR ' + GIFT_BOX_PRICE.toLocaleString() + ')'}`);
      }
      lines.push(`   Delivery: ${pickme ? 'PickMe Flash 🛵' : 'In-Store Collect 🏪'}`);
    } else {
      lines.push(`   Delivery Method: ${contactMeth === 'whatsapp' ? 'via WhatsApp 💬' : 'via Email 📧'}`);
    }

    lines.push('');
    lines.push('💳 *Payment*');
    lines.push(`   Method: ${payment === 'online' ? 'Online Bank Transfer' : 'In-Store (Card / Cash)'}`);
    lines.push(`   Total: LKR ${total.toLocaleString()}${pickme ? ' + PickMe Flash fee' : ''}`);

    if (payment === 'online') {
      lines.push('');
      lines.push('🏦 *Please Transfer To:*');
      lines.push(`   Revival Wellness Services (PVT) LTD`);
      lines.push(`   Account: 005020238639`);
      lines.push(`   Bank: Hatton National Bank PLC`);
      lines.push(`   Branch: Greenpath`);
      lines.push('   Share your slip to: https://wa.me/94761390204');
    }

    lines.push('');
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push('Thank you for choosing Kashi Wellness! 💜');

    return lines.join('\n');
  }

  // ─── Validation ───────────────────────────────────────

  function validate() {
    const buyerName  = $('#kgv_buyer_name').val().trim();
    const buyerWA    = $('#kgv_buyer_whatsapp').val().trim();
    const buyerEmail = $('#kgv_buyer_email').val().trim();
    const recipient  = $('#kgv_recipient').val().trim();
    const value      = getValue();
    const type       = getVoucherType();
    const payment    = getPayment();
    const terms      = $('#kgvTermsCheck').length ? $('#kgvTermsCheck').is(':checked') : true;

    if (!buyerName) return 'Please enter your name.';
    if (!buyerWA && !buyerEmail) return 'Please provide at least one contact method (WhatsApp or Email).';
    if (!recipient) return 'Please enter the recipient\'s name.';
    if (!value || value < 1000) return 'Please enter a valid voucher amount (minimum LKR 1,000).';
    if (!type) return 'Please select a voucher type.';
    if (type === 'evoucher' && !$('input[name="contact_method"]:checked').val()) return 'Please select how you\'d like your e-voucher delivered.';
    if (type === 'physical' && !$('input[name="delivery_method"]:checked').val()) return 'Please select a delivery method for your physical voucher.';
    if (!payment) return 'Please select a payment method.';
    if (!terms) return 'Please agree to the Terms & Conditions.';
    return null;
  }

  // ─── Form Submit ─────────────────────────────────────

  $form.on('submit', function (e) {
    e.preventDefault();
    $error.addClass('kgv-hidden').text('');

    const errMsg = validate();
    if (errMsg) {
      $error.removeClass('kgv-hidden').text(errMsg);
      $error[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const type     = getVoucherType();
    const delivery = getDelivery();
    const pickme   = (type === 'physical' && delivery === 'pickme') ? 1 : 0;
    const total    = calcTotal();

    // Cache form data for modal
    formData = {
      buyer_name:      $('#kgv_buyer_name').val(),
      buyer_whatsapp:  $('#kgv_buyer_whatsapp').val(),
      buyer_email:     $('#kgv_buyer_email').val(),
      recipient_name:  $('#kgv_recipient').val(),
      voucher_value:   getValue(),
      voucher_type:    type,
      gift_box:        getGiftBox() ? 1 : 0,
      delivery_method: delivery || '',
      contact_method:  $('input[name="contact_method"]:checked').val() || '',
      payment_method:  getPayment(),
      total_amount:    total,
      pickme_flash:    pickme,
      nonce:           kgvData.nonce,
      action:          'kgv_save_purchase',
    };

    // Save to DB
    $.post(kgvData.ajaxUrl, formData, function () {
      $modal.removeClass('kgv-hidden');
    });
  });

  // ─── Modal Actions ────────────────────────────────────

  $('#kgvModalClose').on('click', function () {
    $modal.addClass('kgv-hidden');
  });

  $('#kgvSendWA').on('click', function () {
    const text = buildSummaryText();
    const encoded = encodeURIComponent(text);
    window.open('https://wa.me/94761390204?text=' + encoded, '_blank');
  });

  $('#kgvSendEmail').on('click', function () {
    const text = buildSummaryText();
    const subject = encodeURIComponent('Gift Voucher Purchase Request – ' + formData.buyer_name);
    const body    = encodeURIComponent(text.replace(/\*/g, ''));
    window.location.href = `mailto:info@kashiwellness.lk?subject=${subject}&body=${body}`;
  });

  $('#kgvCopyDetails').on('click', function () {
    const text = buildSummaryText().replace(/\*/g, '');
    navigator.clipboard.writeText(text).then(function () {
      const btn = $('#kgvCopyDetails');
      btn.text('✅ Copied!');
      setTimeout(function () { btn.text('📋 Copy Details'); }, 2500);
    });
  });

  // Close modal on overlay click
  $('#kgvModal').on('click', function (e) {
    if ($(e.target).is('#kgvModal')) $modal.addClass('kgv-hidden');
  });
});
