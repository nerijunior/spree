module Spree
  module Api
    module V3
      module Admin
        class PaymentMethodsController < ResourceController
          scoped_resource :settings

          protected

          def model_class
            Spree::PaymentMethod
          end

          def serializer_class
            Spree.api.admin_payment_method_serializer
          end

          def scope
            current_store.payment_methods.accessible_by(current_ability, :show)
          end
        end
      end
    end
  end
end
