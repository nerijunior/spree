module Spree
  module Api
    module V3
      module Admin
        class GiftCardSerializer < V3::GiftCardSerializer
          attributes created_at: :iso8601, updated_at: :iso8601
        end
      end
    end
  end
end
