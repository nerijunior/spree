# frozen_string_literal: true

require 'swagger_helper'

RSpec.describe 'Admin Order Adjustments API', type: :request, swagger_doc: 'api-reference/admin.yaml' do
  include_context 'API v3 Admin'

  let!(:order) { create(:order, store: store, state: 'cart') }
  let!(:adjustment) { create(:adjustment, adjustable: order, order: order, amount: 5.00, label: 'Admin discount') }
  let(:Authorization) { "Bearer #{admin_jwt_token}" }

  path '/api/v3/admin/orders/{order_id}/adjustments' do
    let(:order_id) { order.prefixed_id }

    get 'List adjustments' do
      tags 'Adjustments'
      produces 'application/json'
      security [api_key: [], bearer_auth: []]
      description 'Returns all adjustments for an order. Read-only — adjustments are computed from promotions, taxes, and fees.'

      parameter name: 'x-spree-api-key', in: :header, type: :string, required: true
      parameter name: :Authorization, in: :header, type: :string, required: true,
                description: 'Bearer token for admin authentication'
      parameter name: :order_id, in: :path, type: :string, required: true,
                description: 'Order prefixed ID'

      response '200', 'adjustments found' do
        let(:'x-spree-api-key') { secret_api_key.plaintext_token }

        run_test! do |response|
          data = JSON.parse(response.body)
          expect(data['data']).to be_an(Array)
          expect(data['data'].length).to be >= 1
        end
      end
    end
  end

  path '/api/v3/admin/orders/{order_id}/adjustments/{id}' do
    let(:order_id) { order.prefixed_id }
    let(:id) { adjustment.prefixed_id }

    get 'Show an adjustment' do
      tags 'Adjustments'
      produces 'application/json'
      security [api_key: [], bearer_auth: []]
      description 'Returns details of a specific adjustment.'

      parameter name: 'x-spree-api-key', in: :header, type: :string, required: true
      parameter name: :Authorization, in: :header, type: :string, required: true,
                description: 'Bearer token for admin authentication'
      parameter name: :order_id, in: :path, type: :string, required: true,
                description: 'Order prefixed ID'
      parameter name: :id, in: :path, type: :string, required: true,
                description: 'Adjustment prefixed ID'

      response '200', 'adjustment found' do
        let(:'x-spree-api-key') { secret_api_key.plaintext_token }

        run_test! do |response|
          data = JSON.parse(response.body)
          expect(data['id']).to eq(adjustment.prefixed_id)
        end
      end
    end
  end
end
