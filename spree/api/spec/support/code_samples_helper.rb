# frozen_string_literal: true

module CodeSamplesHelper
  SDK_CLIENT_INIT = <<~JS.strip
    import { createClient } from '@spree/sdk'

    const client = createClient({
      baseUrl: 'https://your-store.com',
      publishableKey: '<api-key>',
    })
  JS

  ADMIN_SDK_CLIENT_INIT = <<~JS.strip
    import { createAdminClient } from '@spree/admin-sdk'

    const client = createAdminClient({
      baseUrl: 'https://your-store.com',
      secretKey: 'sk_xxx',
    })
  JS

  def code_samples(*samples)
    metadata[:operation][:'x-codeSamples'] = samples.map do |sample|
      { lang: sample[:lang], label: sample[:label], source: sample[:source].strip }
    end
  end

  def sdk_example(source)
    code_samples(
      {
        lang: 'javascript',
        label: 'Spree SDK',
        source: "#{SDK_CLIENT_INIT}\n\n#{source.strip}\n"
      }
    )
  end

  def admin_sdk_example(source)
    code_samples(
      {
        lang: 'javascript',
        label: 'Spree Admin SDK',
        source: "#{ADMIN_SDK_CLIENT_INIT}\n\n#{source.strip}\n"
      }
    )
  end

  # Appends a `**Required scope:**` line to the operation description.
  # Use in admin integration specs to surface scope requirements in the
  # rendered Mintlify docs without inventing a custom OpenAPI extension.
  #
  #   admin_scope :read, :orders
  #   admin_scope :write, :customers
  def admin_scope(action, resource)
    line = "**Required scope:** `#{action}_#{resource}` (for API-key authentication)."
    existing = metadata[:operation][:description].to_s
    metadata[:operation][:description] = existing.empty? ? line : "#{existing}\n\n#{line}"
  end
end

RSpec.configure do |config|
  config.extend CodeSamplesHelper, type: :request
end
