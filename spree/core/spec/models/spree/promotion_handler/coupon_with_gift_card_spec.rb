require 'spec_helper'

describe Spree::PromotionHandler::Coupon, type: :model do
  describe 'for a gift card' do
    describe 'apply' do
      let(:store) { Spree::Store.default }
      let(:order) { create(:order_with_line_items, store: store) }
      let(:gift_card) { create(:gift_card, store: store, amount: 10) }

      before do
        order.update_column(:total, 30)
      end

      context 'when gift card is not applied' do
        it 'applies gift card' do
          order.coupon_code = gift_card.code

          described_class.new(order).apply

          expect(order.reload.gift_card).to eq(gift_card)
          expect(order.total_applied_store_credit).to eq(10)
        end
      end

      context 'when the gift card is applied to another order' do
        let(:old_order) { create(:order, store: store) }

        before do
          old_order.update_column(:total, 30)
        end

        it "doesn't apply the gift card to a new order" do
          old_order.coupon_code = gift_card.code
          described_class.new(old_order).apply

          expect(old_order.reload.gift_card).to eq(gift_card)
          expect(old_order.total_applied_store_credit).to eq(10)

          order.coupon_code = gift_card.code
          described_class.new(order).apply

          expect(order.reload.gift_card).to eq(nil)
          expect(order.total_applied_store_credit).to eq(0)
        end
      end

      context 'when gift card is expired' do
        let(:gift_card) { create(:gift_card, :expired) }

        it 'returns error code' do
          order.coupon_code = gift_card.code
          handler = described_class.new(order)
          handler.apply

          expect(order.reload.gift_card).to eq(nil)
          expect(order.total_applied_store_credit).to eq(0)
          expect(handler.status_code).to eq(:gift_card_expired)
        end
      end

      context 'when gift card is already redeemed' do
        let(:gift_card) { create(:gift_card, :redeemed) }

        it 'returns error code' do
          order.coupon_code = gift_card.code
          handler = described_class.new(order)
          handler.apply

          expect(order.reload.gift_card).to eq(nil)
          expect(order.total_applied_store_credit).to eq(0)
          expect(handler.status_code).to eq(:gift_card_already_redeemed)
        end
      end
    end
  end

  describe '#remove' do
    context 'when gift card is applied' do
      let(:store) { Spree::Store.default }
      let(:order) { create(:order_with_line_items, store: store) }
      let(:gift_card) { create(:gift_card, store: store, amount: 10) }

      subject { Spree::PromotionHandler::Coupon.new(order) }

      before do
        order.update_column(:total, 30)
        order.apply_gift_card(gift_card)
      end

      it 'removes gift card' do
        subject.remove(gift_card.code)
        expect(order.reload.gift_card).to be_nil
      end
    end
  end

  describe 'enable_gift_cards option' do
    let(:store) { Spree::Store.default }
    let(:order) { create(:order_with_line_items, store: store) }
    let(:gift_card) { create(:gift_card, store: store, amount: 10) }

    before do
      order.update_column(:total, 30)
    end

    describe '#apply' do
      context 'when enable_gift_cards: false' do
        it 'does not apply gift card and falls through to coupon code lookup' do
          order.coupon_code = gift_card.code
          handler = described_class.new(order, enable_gift_cards: false)
          handler.apply

          expect(order.reload.gift_card).to be_nil
          expect(handler.status_code).to eq(:coupon_code_not_found)
        end
      end

      context 'when enable_gift_cards: true (explicit)' do
        it 'applies gift card' do
          order.coupon_code = gift_card.code
          handler = described_class.new(order, enable_gift_cards: true)
          handler.apply

          expect(order.reload.gift_card).to eq(gift_card)
        end
      end

      context 'when enable_gift_cards is not specified (default)' do
        it 'applies gift card for backwards compatibility' do
          order.coupon_code = gift_card.code
          handler = described_class.new(order)
          handler.apply

          expect(order.reload.gift_card).to eq(gift_card)
        end
      end
    end

    describe '#remove' do
      before do
        order.apply_gift_card(gift_card)
      end

      context 'when enable_gift_cards: false' do
        it 'does not remove gift card and falls through to coupon code lookup' do
          handler = described_class.new(order, enable_gift_cards: false)
          handler.remove(gift_card.code)

          expect(order.reload.gift_card).to eq(gift_card)
          expect(handler.status_code).to eq(:coupon_code_not_found)
        end
      end

      context 'when enable_gift_cards: true (explicit)' do
        it 'removes gift card' do
          handler = described_class.new(order, enable_gift_cards: true)
          handler.remove(gift_card.code)

          expect(order.reload.gift_card).to be_nil
        end
      end

      context 'when enable_gift_cards is not specified (default)' do
        it 'removes gift card for backwards compatibility' do
          handler = described_class.new(order)
          handler.remove(gift_card.code)

          expect(order.reload.gift_card).to be_nil
        end
      end
    end
  end
end
