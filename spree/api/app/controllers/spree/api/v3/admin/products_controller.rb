module Spree
  module Api
    module V3
      module Admin
        class ProductsController < ResourceController
          # PATCH /api/v3/admin/products/:id
          def update
            if @resource.update(update_params)
              render json: serialize_resource(@resource)
            else
              render_validation_error(@resource.errors)
            end
          end

          # POST /api/v3/admin/products/:id/clone
          def clone
            @resource = find_resource
            authorize!(:create, @resource)

            result = @resource.duplicate
            if result.success?
              render json: serialize_resource(result.value), status: :created
            else
              render_service_error(result.error)
            end
          end

          protected

          def model_class
            Spree::Product
          end

          def serializer_class
            Spree.api.admin_product_serializer
          end

          def scope_includes
            [
              primary_media: [attachment_attachment: :blob],
              master: [:prices, stock_items: :stock_location],
              variants: [:prices, stock_items: :stock_location],
              variants_including_master: [stock_items: :stock_location]
            ]
          end

          # Use SearchProvider::Database for collection to handle price/best_selling
          # sorting correctly (counts before sorting, avoiding PG/Mobility issues).
          def collection
            return @collection if @collection.present?

            filters = params[:q]&.to_unsafe_h || params[:q] || {}

            result = search_provider.search_and_filter(
              scope: scope.includes(collection_includes).preload_associations_lazily.accessible_by(current_ability, :show),
              query: nil,
              filters: filters,
              sort: sort_param,
              page: page,
              limit: limit
            )

            @pagy = result.pagy
            @collection = result.products
          end

          def permitted_params
            params.permit(
              *Spree::PermittedAttributes.product_attributes,
              tags: [],
              variants: [
                :id, :sku, :barcode, :price, :compare_at_price,
                :cost_price, :cost_currency,
                :weight, :height, :width, :depth, :weight_unit, :dimensions_unit,
                :track_inventory, :tax_category_id, :position,
                options: [:name, :value],
                prices: [:amount, :compare_at_amount, :currency],
                stock_items: [:stock_location_id, :count_on_hand, :backorderable]
              ]
            )
          end

          private

          def search_provider
            @search_provider ||= Spree::SearchProvider::Database.new(current_store)
          end

          def update_params
            p = permitted_params.to_h.with_indifferent_access

            if p.key?(:taxon_ids)
              other_store_taxon_ids = @resource.taxons
                                               .joins(:taxonomy)
                                               .where.not(spree_taxonomies: { store_id: current_store.id })
                                               .pluck(:id)
              p[:taxon_ids] = (Array(p[:taxon_ids]) + other_store_taxon_ids).uniq
            end

            p
          end
        end
      end
    end
  end
end
