module Spree
  module Api
    module V3
      module Admin
        class CountriesController < ResourceController
          protected

          def model_class
            Spree::Country
          end

          def serializer_class
            Spree.api.admin_country_serializer
          end

          def scope
            Spree::Country.all.order(:name)
          end

          def find_resource
            scope.find_by!(iso: params[:id].upcase)
          end
        end
      end
    end
  end
end
