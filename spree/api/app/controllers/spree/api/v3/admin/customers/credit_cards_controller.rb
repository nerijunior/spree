module Spree
  module Api
    module V3
      module Admin
        module Customers
          class CreditCardsController < ResourceController
            protected

            def set_parent
              @parent = Spree.user_class.find_by_prefix_id!(params[:customer_id])
            end

            def parent_association
              :credit_cards
            end

            def model_class
              Spree::CreditCard
            end

            def serializer_class
              Spree.api.admin_credit_card_serializer
            end
          end
        end
      end
    end
  end
end
