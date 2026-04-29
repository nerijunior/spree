require 'spec_helper'

RSpec.describe Spree::Api::V3::Admin::PaymentMethodsController, type: :controller do
  render_views

  include_context 'API v3 Admin authenticated'

  let!(:payment_method) { create(:check_payment_method, stores: [store]) }

  before { request.headers.merge!(headers) }

  describe 'GET #index' do
    it 'returns store-scoped payment methods' do
      get :index, as: :json

      expect(response).to have_http_status(:ok)
      expect(json_response['data']).to be_an(Array)
      expect(json_response['data'].map { |pm| pm['id'] }).to include(payment_method.prefixed_id)
    end

    context 'when payment method belongs to a different store' do
      let!(:other_store) { create(:store) }
      let!(:other_payment_method) { create(:check_payment_method, stores: [other_store]) }

      it 'is not returned' do
        get :index, as: :json

        expect(json_response['data'].map { |pm| pm['id'] }).not_to include(other_payment_method.prefixed_id)
      end
    end
  end

  describe 'GET #show' do
    it 'returns the payment method' do
      get :show, params: { id: payment_method.prefixed_id }, as: :json

      expect(response).to have_http_status(:ok)
      expect(json_response['id']).to eq(payment_method.prefixed_id)
    end
  end
end
