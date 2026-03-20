# frozen_string_literal: true

require 'swagger_helper'

RSpec.describe 'Admin Authentication API', type: :request, swagger_doc: 'api-reference/admin.yaml' do
  include_context 'API v3 Admin'

  let(:existing_admin) { create(:admin_user, password: 'password123', password_confirmation: 'password123') }

  path '/api/v3/admin/auth/login' do
    post 'Login' do
      tags 'Authentication'
      consumes 'application/json'
      produces 'application/json'
      security [api_key: []]
      description 'Authenticates an admin user with email/password and returns a JWT token'

      sdk_example <<~JS
        const auth = await client.admin.auth.login({
          email: 'admin@example.com',
          password: 'password123',
        })
      JS

      parameter name: 'x-spree-api-key', in: :header, type: :string, required: true
      parameter name: :body, in: :body, schema: {
        type: :object,
        properties: {
          provider: { type: :string, example: 'email', description: 'Authentication provider (default: email)' },
          email: { type: :string, format: 'email', example: 'admin@example.com' },
          password: { type: :string, example: 'password123' }
        },
        required: %w[email password]
      }

      response '200', 'login successful' do
        let(:'x-spree-api-key') { secret_api_key.plaintext_token }
        let(:body) { { email: existing_admin.email, password: 'password123' } }

        schema '$ref' => '#/components/schemas/AuthResponse'

        run_test! do |response|
          data = JSON.parse(response.body)
          expect(data['token']).to be_present
          expect(data['user']).to be_present
          expect(data['user']['email']).to eq(existing_admin.email)
        end
      end

      response '401', 'invalid credentials' do
        let(:'x-spree-api-key') { secret_api_key.plaintext_token }
        let(:body) { { email: existing_admin.email, password: 'wrong_password' } }

        schema '$ref' => '#/components/schemas/ErrorResponse'

        run_test!
      end

      response '401', 'user not found' do
        let(:'x-spree-api-key') { secret_api_key.plaintext_token }
        let(:body) { { email: 'nonexistent@example.com', password: 'password123' } }

        schema '$ref' => '#/components/schemas/ErrorResponse'

        run_test!
      end

      response '401', 'non-admin user' do
        let(:'x-spree-api-key') { secret_api_key.plaintext_token }
        let(:regular_user) { create(:user, password: 'password123', password_confirmation: 'password123') }
        let(:body) { { email: regular_user.email, password: 'password123' } }

        schema '$ref' => '#/components/schemas/ErrorResponse'

        run_test!
      end
    end
  end

  path '/api/v3/admin/auth/refresh' do
    post 'Refresh token' do
      tags 'Authentication'
      consumes 'application/json'
      produces 'application/json'
      security [api_key: []]
      description 'Rotates a refresh token and returns a new JWT access token'

      sdk_example <<~JS
        const auth = await client.admin.auth.refresh({
          refresh_token: 'rt_xxx',
        })
      JS

      parameter name: 'x-spree-api-key', in: :header, type: :string, required: true
      parameter name: :body, in: :body, schema: {
        type: :object,
        properties: {
          refresh_token: { type: :string, description: 'Refresh token obtained from login' }
        },
        required: %w[refresh_token]
      }

      response '200', 'token refreshed' do
        let(:'x-spree-api-key') { secret_api_key.plaintext_token }
        let(:refresh_token) { Spree::RefreshToken.create_for(admin_user, request_env: { ip_address: '127.0.0.1', user_agent: 'test' }) }
        let(:body) { { refresh_token: refresh_token.token } }

        schema '$ref' => '#/components/schemas/AuthResponse'

        run_test! do |response|
          data = JSON.parse(response.body)
          expect(data['token']).to be_present
          expect(data['refresh_token']).to be_present
          expect(data['user']).to be_present
          expect(data['user']['email']).to eq(admin_user.email)
        end
      end

      response '401', 'missing or invalid refresh token' do
        let(:'x-spree-api-key') { secret_api_key.plaintext_token }
        let(:body) { { refresh_token: 'invalid_token' } }

        schema '$ref' => '#/components/schemas/ErrorResponse'

        run_test!
      end
    end
  end
end
