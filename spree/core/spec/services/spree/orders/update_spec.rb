require 'spec_helper'

module Spree
  RSpec.describe Orders::Update do
    let(:store) { create(:store) }
    let(:user) { create(:user) }
    let(:order) { create(:order, user: user, store: store) }
    let(:variant) { create(:variant) }

    before do
      variant.stock_items.first.update!(count_on_hand: 10)
      store.products << variant.product unless store.products.include?(variant.product)
    end

    describe '#call' do
      subject { described_class.call(order: order, params: params) }

      context 'with empty params' do
        let(:params) { {} }

        it 'returns success' do
          expect(subject).to be_success
        end
      end

      context 'updating scalar attributes' do
        let(:params) { { email: 'new@example.com', customer_note: 'Leave at door' } }

        it 'updates the order' do
          expect(subject).to be_success
          order.reload
          expect(order.email).to eq('new@example.com')
          expect(order.customer_note).to eq('Leave at door')
        end
      end

      context 'with items array' do
        let(:params) do
          { items: [{ variant_id: variant.prefixed_id, quantity: 2 }] }
        end

        it 'creates the line item' do
          expect(subject).to be_success
          order.reload
          expect(order.line_items.find_by(variant: variant).quantity).to eq(2)
        end
      end

      context 'with both attributes and items' do
        let(:params) do
          {
            email: 'order@example.com',
            items: [{ variant_id: variant.prefixed_id, quantity: 1 }]
          }
        end

        it 'updates both' do
          expect(subject).to be_success
          order.reload
          expect(order.email).to eq('order@example.com')
          expect(order.line_items.find_by(variant: variant)).to be_present
        end
      end

      context 'with item that fails (currency mismatch)' do
        let(:order) { create(:order, user: user, store: store, currency: 'GBP') }
        let(:params) do
          {
            email: 'gbp@example.com',
            items: [{ variant_id: variant.prefixed_id, quantity: 1 }]
          }
        end

        it 'rolls back the entire update' do
          expect(subject).to be_failure
          expect(order.reload.email).not_to eq('gbp@example.com')
          expect(order.line_items.count).to eq(0)
        end
      end

      context 'with invalid variant in items' do
        let(:params) do
          {
            email: 'before@example.com',
            items: [{ variant_id: 'variant_doesnotexist', quantity: 1 }]
          }
        end

        it 'raises RecordNotFound and does not commit attribute changes' do
          expect { subject }.to raise_error(ActiveRecord::RecordNotFound)
          expect(order.reload.email).not_to eq('before@example.com')
        end
      end

      context 'with empty items array' do
        let(:params) { { items: [] } }

        it 'is a no-op for items, returns success' do
          expect(subject).to be_success
          expect(order.line_items.count).to eq(0)
        end
      end

      context 'replaces an existing line item quantity' do
        let!(:existing) { create(:line_item, order: order, variant: variant, quantity: 5) }
        let(:params) do
          { items: [{ variant_id: variant.prefixed_id, quantity: 2 }] }
        end

        it 'sets quantity to 2 (not 7)' do
          expect(subject).to be_success
          expect(existing.reload.quantity).to eq(2)
        end
      end

      context 'with string keys' do
        let(:params) do
          { 'email' => 'string@example.com', 'items' => [{ 'variant_id' => variant.prefixed_id, 'quantity' => 1 }] }
        end

        it 'handles string keys' do
          expect(subject).to be_success
          order.reload
          expect(order.email).to eq('string@example.com')
          expect(order.line_items.find_by(variant: variant)).to be_present
        end
      end
    end
  end
end
