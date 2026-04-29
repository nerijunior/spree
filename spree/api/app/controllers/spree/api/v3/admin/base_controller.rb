module Spree
  module Api
    module V3
      module Admin
        class BaseController < Spree::Api::V3::BaseController
          include Spree::Api::V3::AdminAuthentication
          include Spree::Api::V3::ScopedAuthorization
        end
      end
    end
  end
end
