module Spree
  module Api
    module V3
      module Admin
        class OptionTypeSerializer < V3::OptionTypeSerializer
          attributes created_at: :iso8601, updated_at: :iso8601

          many :option_values,
               resource: Spree.api.admin_option_value_serializer
        end
      end
    end
  end
end
