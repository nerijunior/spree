# frozen_string_literal: true

require 'swagger_helper'

RSpec.describe 'Admin Orders API', type: :request, swagger_doc: 'api-reference/admin.yaml' do
  include_context 'API v3 Admin'

  let!(:order) { create(:order, store: store, state: 'cart', email: 'test@example.com') }
  let(:Authorization) { "Bearer #{admin_jwt_token}" }

  path '/api/v3/admin/orders' do
    get 'List orders' do
      tags 'Orders'
      produces 'application/json'
      security [api_key: [], bearer_auth: []]
      description 'Returns a paginated list of orders for the current store.'

      parameter name: 'x-spree-api-key', in: :header, type: :string, required: true
      parameter name: :Authorization, in: :header, type: :string, required: true,
                description: 'Bearer token for admin authentication'
      parameter name: :page, in: :query, type: :integer, required: false, description: 'Page number'
      parameter name: :limit, in: :query, type: :integer, required: false, description: 'Number of records per page'
      parameter name: :sort, in: :query, type: :string, required: false,
                description: 'Sort field (e.g., created_at, -created_at, completed_at)'
      parameter name: :'q[state_eq]', in: :query, type: :string, required: false,
                description: 'Filter by state (cart, address, delivery, payment, confirm, complete, canceled)'
      parameter name: :'q[email_cont]', in: :query, type: :string, required: false,
                description: 'Filter by email (contains)'
      parameter name: :'q[number_eq]', in: :query, type: :string, required: false,
                description: 'Filter by order number'
      parameter name: :'q[completed_at_gt]', in: :query, type: :string, required: false,
                description: 'Filter by completed after date'

      response '200', 'orders found' do
        let(:'x-spree-api-key') { secret_api_key.plaintext_token }

        run_test! do |response|
          data = JSON.parse(response.body)
          expect(data['data']).to be_an(Array)
          expect(data['meta']).to include('page', 'limit', 'count', 'pages')
        end
      end

      response '401', 'unauthorized' do
        let(:'x-spree-api-key') { 'invalid' }
        let(:Authorization) { 'Bearer invalid' }

        schema '$ref' => '#/components/schemas/ErrorResponse'

        run_test!
      end
    end

    post 'Create a draft order' do
      tags 'Orders'
      consumes 'application/json'
      produces 'application/json'
      security [api_key: [], bearer_auth: []]
      description <<~DESC
        Creates a new draft order in one shot. Customer, items, addresses, currency,
        market, locale, notes, metadata, and a coupon code can all be provided inline.

        Invalid coupon codes are non-fatal — the order is created and the failure
        is reported on the service result (not in the API response body for now).
      DESC

      parameter name: 'x-spree-api-key', in: :header, type: :string, required: true
      parameter name: :Authorization, in: :header, type: :string, required: true,
                description: 'Bearer token for admin authentication'
      parameter name: :body, in: :body, schema: {
        type: :object,
        properties: {
          email: { type: :string, example: 'customer@example.com' },
          customer_id: { type: :string, description: 'Customer prefixed ID. Alias: user_id (legacy).' },
          use_customer_default_address: { type: :boolean, description: "When true with customer_id, copies the customer's saved billing/shipping addresses onto the order." },
          currency: { type: :string, example: 'USD' },
          market_id: { type: :string, description: 'Market prefixed ID' },
          locale: { type: :string, example: 'en-US' },
          customer_note: { type: :string, description: 'Public, customer-visible note' },
          internal_note: { type: :string, description: 'Staff-only note' },
          metadata: { type: :object, description: 'Arbitrary key/value metadata' },
          shipping_address: {
            type: :object,
            properties: {
              first_name: { type: :string }, last_name: { type: :string },
              address1: { type: :string }, city: { type: :string },
              postal_code: { type: :string }, country_iso: { type: :string },
              state_abbr: { type: :string }, phone: { type: :string }
            }
          },
          shipping_address_id: { type: :string, description: 'Existing customer address prefixed ID' },
          billing_address: {
            type: :object,
            properties: {
              first_name: { type: :string }, last_name: { type: :string },
              address1: { type: :string }, city: { type: :string },
              postal_code: { type: :string }, country_iso: { type: :string },
              state_abbr: { type: :string }, phone: { type: :string }
            }
          },
          billing_address_id: { type: :string, description: 'Existing customer address prefixed ID' },
          items: {
            type: :array,
            items: {
              type: :object,
              required: %w[variant_id quantity],
              properties: {
                variant_id: { type: :string, description: 'Variant prefixed ID' },
                quantity: { type: :integer, example: 1 },
                metadata: { type: :object }
              }
            }
          },
          coupon_code: { type: :string, description: 'Optional. Applied non-fatally; invalid codes do not block creation.' }
        }
      }

      response '201', 'order created' do
        let(:'x-spree-api-key') { secret_api_key.plaintext_token }
        let(:body) { { email: 'new-order@example.com' } }

        run_test! do |response|
          data = JSON.parse(response.body)
          expect(data['email']).to eq('new-order@example.com')
        end
      end
    end
  end

  path '/api/v3/admin/orders/{id}' do
    let(:id) { order.prefixed_id }

    get 'Show an order' do
      tags 'Orders'
      produces 'application/json'
      security [api_key: [], bearer_auth: []]
      description 'Returns full order details including admin-only fields.'

      parameter name: 'x-spree-api-key', in: :header, type: :string, required: true
      parameter name: :Authorization, in: :header, type: :string, required: true,
                description: 'Bearer token for admin authentication'
      parameter name: :id, in: :path, type: :string, required: true,
                description: 'Order prefixed ID (e.g., or_xxx)'
      parameter name: :expand, in: :query, type: :string, required: false,
                description: 'Comma-separated associations to expand (e.g., user)'

      response '200', 'order found' do
        let(:'x-spree-api-key') { secret_api_key.plaintext_token }

        run_test! do |response|
          data = JSON.parse(response.body)
          expect(data['id']).to eq(order.prefixed_id)
        end
      end

      response '404', 'order not found' do
        let(:'x-spree-api-key') { secret_api_key.plaintext_token }
        let(:id) { 'or_nonexistent' }

        schema '$ref' => '#/components/schemas/ErrorResponse'

        run_test!
      end
    end

    patch 'Update an order' do
      tags 'Orders'
      consumes 'application/json'
      produces 'application/json'
      security [api_key: [], bearer_auth: []]
      description 'Updates an order. Supports updating email, addresses, special instructions, and line items.'

      parameter name: 'x-spree-api-key', in: :header, type: :string, required: true
      parameter name: :Authorization, in: :header, type: :string, required: true,
                description: 'Bearer token for admin authentication'
      parameter name: :id, in: :path, type: :string, required: true,
                description: 'Order prefixed ID'
      parameter name: :body, in: :body, schema: {
        type: :object,
        properties: {
          email: { type: :string },
          special_instructions: { type: :string },
          internal_note: { type: :string },
          ship_address: {
            type: :object,
            properties: {
              firstname: { type: :string },
              lastname: { type: :string },
              address1: { type: :string },
              city: { type: :string },
              zipcode: { type: :string },
              country_iso: { type: :string },
              state_abbr: { type: :string },
              phone: { type: :string }
            }
          },
          bill_address: {
            type: :object,
            properties: {
              firstname: { type: :string },
              lastname: { type: :string },
              address1: { type: :string },
              city: { type: :string },
              zipcode: { type: :string },
              country_iso: { type: :string },
              state_abbr: { type: :string },
              phone: { type: :string }
            }
          },
          items: {
            type: :array,
            items: {
              type: :object,
              required: %w[variant_id],
              properties: {
                variant_id: { type: :string, description: 'Variant prefixed ID' },
                quantity: { type: :integer, example: 1 },
                metadata: { type: :object }
              }
            }
          }
        }
      }

      response '200', 'order updated' do
        let(:'x-spree-api-key') { secret_api_key.plaintext_token }
        let(:body) { { email: 'updated@example.com' } }

        run_test! do |response|
          data = JSON.parse(response.body)
          expect(data['email']).to eq('updated@example.com')
        end
      end
    end

    delete 'Delete a draft order' do
      tags 'Orders'
      security [api_key: [], bearer_auth: []]
      description 'Deletes a draft order. Completed orders cannot be deleted.'

      parameter name: 'x-spree-api-key', in: :header, type: :string, required: true
      parameter name: :Authorization, in: :header, type: :string, required: true,
                description: 'Bearer token for admin authentication'
      parameter name: :id, in: :path, type: :string, required: true,
                description: 'Order prefixed ID'

      response '204', 'order deleted' do
        let(:'x-spree-api-key') { secret_api_key.plaintext_token }

        run_test!
      end
    end
  end

  path '/api/v3/admin/orders/{id}/cancel' do
    patch 'Cancel an order' do
      tags 'Orders'
      produces 'application/json'
      security [api_key: [], bearer_auth: []]
      description 'Cancels a completed order.'

      parameter name: 'x-spree-api-key', in: :header, type: :string, required: true
      parameter name: :Authorization, in: :header, type: :string, required: true,
                description: 'Bearer token for admin authentication'
      parameter name: :id, in: :path, type: :string, required: true,
                description: 'Order prefixed ID'

      response '200', 'order canceled' do
        let(:'x-spree-api-key') { secret_api_key.plaintext_token }
        let!(:order) { create(:completed_order_with_totals, store: store) }
        let(:id) { order.prefixed_id }

        run_test!
      end
    end
  end

  path '/api/v3/admin/orders/{id}/approve' do
    patch 'Approve an order' do
      tags 'Orders'
      produces 'application/json'
      security [api_key: [], bearer_auth: []]
      description 'Approves an order (e.g., for fraud review).'

      parameter name: 'x-spree-api-key', in: :header, type: :string, required: true
      parameter name: :Authorization, in: :header, type: :string, required: true,
                description: 'Bearer token for admin authentication'
      parameter name: :id, in: :path, type: :string, required: true,
                description: 'Order prefixed ID'

      response '200', 'order approved' do
        let(:'x-spree-api-key') { secret_api_key.plaintext_token }
        let!(:order) { create(:completed_order_with_totals, store: store) }
        let(:id) { order.prefixed_id }

        run_test! do |response|
          data = JSON.parse(response.body)
          expect(data['approved_at']).to be_present
        end
      end
    end
  end

  path '/api/v3/admin/orders/{id}/resume' do
    patch 'Resume a canceled order' do
      tags 'Orders'
      produces 'application/json'
      security [api_key: [], bearer_auth: []]
      description 'Resumes a previously canceled order.'

      parameter name: 'x-spree-api-key', in: :header, type: :string, required: true
      parameter name: :Authorization, in: :header, type: :string, required: true,
                description: 'Bearer token for admin authentication'
      parameter name: :id, in: :path, type: :string, required: true,
                description: 'Order prefixed ID'

      response '200', 'order resumed' do
        let(:'x-spree-api-key') { secret_api_key.plaintext_token }
        let!(:order) { create(:completed_order_with_totals, store: store) }
        let(:id) { order.prefixed_id }

        before do
          order.canceled_by(admin_user)
        end

        run_test!
      end
    end
  end

  path '/api/v3/admin/orders/{id}/resend_confirmation' do
    post 'Resend confirmation email' do
      tags 'Orders'
      produces 'application/json'
      security [api_key: [], bearer_auth: []]
      description 'Publishes the order.completed event to trigger confirmation email delivery.'

      parameter name: 'x-spree-api-key', in: :header, type: :string, required: true
      parameter name: :Authorization, in: :header, type: :string, required: true,
                description: 'Bearer token for admin authentication'
      parameter name: :id, in: :path, type: :string, required: true,
                description: 'Order prefixed ID'

      response '200', 'confirmation resent' do
        let(:'x-spree-api-key') { secret_api_key.plaintext_token }
        let!(:order) { create(:completed_order_with_totals, store: store) }
        let(:id) { order.prefixed_id }

        run_test! do |response|
          data = JSON.parse(response.body)
          expect(data['id']).to eq(order.prefixed_id)
        end
      end
    end
  end
end
