require 'spec_helper'

# Verifies the ScopedAuthorization concern that gates Admin API requests
# authenticated via secret API key. Uses OrdersController as a representative
# resource — the same mechanic applies to every admin controller via the
# `scoped_resource` declaration.
RSpec.describe Spree::Api::V3::Admin::OrdersController, type: :controller do
  render_views
  include_context 'API v3 Admin'

  let!(:order) { create(:order, store: store, state: 'cart') }
  let(:secret_key) { create(:api_key, :secret, store: store, created_by: admin_user, scopes: scopes) }

  before { request.headers['X-Spree-Api-Key'] = secret_key.plaintext_token }

  describe 'with required scope' do
    let(:scopes) { ['read_orders'] }

    it 'allows reads' do
      get :index, as: :json
      expect(response).to have_http_status(:ok)
    end
  end

  describe 'without required scope' do
    let(:scopes) { ['read_customers'] }

    it 'returns 403 with access_denied + required_scope details' do
      get :index, as: :json

      expect(response).to have_http_status(:forbidden)
      body = JSON.parse(response.body)
      expect(body['error']['code']).to eq('access_denied')
      expect(body['error']['details']['required_scope']).to eq('read_orders')
    end
  end

  describe 'write action with read-only scope' do
    let(:scopes) { ['read_orders'] }

    it 'denies the write' do
      delete :destroy, params: { id: order.prefixed_id }, as: :json

      expect(response).to have_http_status(:forbidden)
      body = JSON.parse(response.body)
      expect(body['error']['code']).to eq('access_denied')
      expect(body['error']['details']['required_scope']).to eq('write_orders')
    end
  end

  describe 'write_X implies read_X' do
    let(:scopes) { ['write_orders'] }

    it 'allows reads' do
      get :index, as: :json
      expect(response).to have_http_status(:ok)
    end
  end

  describe 'read_all alias' do
    let(:scopes) { ['read_all'] }

    it 'allows reads on any resource' do
      get :index, as: :json
      expect(response).to have_http_status(:ok)
    end

    it 'denies writes' do
      delete :destroy, params: { id: order.prefixed_id }, as: :json
      expect(response).to have_http_status(:forbidden)
    end
  end

  describe 'write_all alias' do
    let(:scopes) { ['write_all'] }

    it 'allows reads' do
      get :index, as: :json
      expect(response).to have_http_status(:ok)
    end

    it 'allows writes' do
      delete :destroy, params: { id: order.prefixed_id }, as: :json
      expect(response).to have_http_status(:no_content)
    end
  end

  describe 'JWT-authenticated request' do
    # JWT bypasses scope checks; CanCanCan abilities apply instead.
    before do
      request.headers['X-Spree-Api-Key'] = nil
      request.headers['Authorization'] = "Bearer #{admin_jwt_token}"
    end

    let(:scopes) { ['read_customers'] } # irrelevant — JWT auth doesn't read scopes

    it 'bypasses scope checks' do
      get :index, as: :json
      expect(response).to have_http_status(:ok)
    end
  end
end
