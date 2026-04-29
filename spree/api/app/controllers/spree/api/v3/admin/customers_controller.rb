module Spree
  module Api
    module V3
      module Admin
        class CustomersController < ResourceController
          def create
            @resource = Spree.user_class.new(permitted_params)
            authorize!(:create, @resource)

            if @resource.save
              render json: serialize_resource(@resource), status: :created
            else
              render_validation_error(@resource.errors)
            end
          end

          def update
            authorize_resource!(@resource)

            if @resource.update(permitted_params)
              render json: serialize_resource(@resource.reload)
            else
              render_validation_error(@resource.errors)
            end
          end

          def destroy
            authorize_resource!(@resource)
            @resource.destroy
            head :no_content
          rescue Spree::Core::DestroyWithOrdersError => e
            render_error(
              code: 'customer_has_orders',
              message: e.message.presence || Spree.t(:error_user_destroy_with_orders),
              status: :unprocessable_content
            )
          end

          protected

          def model_class
            Spree.user_class
          end

          def serializer_class
            Spree.api.admin_customer_serializer
          end

          def scope
            super.with_order_aggregates
          end

          def collection_includes
            [:rich_text_internal_note, taggings: :tag]
          end

          private

          def permitted_params
            params.permit(
              :email, :first_name, :last_name, :phone,
              :password, :password_confirmation, :selected_locale,
              :avatar, :accepts_email_marketing, :internal_note,
              metadata: {}, tags: []
            )
          end
        end
      end
    end
  end
end
