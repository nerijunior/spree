import type { Address } from '@spree/admin-sdk'
import { type FormEvent, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCountries } from '@/hooks/use-countries'

export interface AddressParams {
  first_name: string
  last_name: string
  address1: string
  address2: string
  city: string
  postal_code: string
  country_iso: string
  state_abbr: string
  phone: string
}

export function AddressFormDialog({
  address,
  open,
  onOpenChange,
  onSave,
  title = 'Edit Address',
  isPending = false,
}: {
  address: Address | null | undefined
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (address: AddressParams) => void
  title?: string
  isPending?: boolean
}) {
  const { countries } = useCountries()
  const [selectedCountryIso, setSelectedCountryIso] = useState<string>(
    address?.country_iso ?? '',
  )

  const selectedCountry = useMemo(
    () => countries.find((c) => c.iso === selectedCountryIso),
    [countries, selectedCountryIso],
  )

  const statesRequired = selectedCountry?.states_required ?? false
  const states = selectedCountry?.states ?? []

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    onSave({
      first_name: fd.get('first_name') as string,
      last_name: fd.get('last_name') as string,
      address1: fd.get('address1') as string,
      address2: fd.get('address2') as string,
      city: fd.get('city') as string,
      postal_code: fd.get('postal_code') as string,
      country_iso: fd.get('country_iso') as string,
      state_abbr: fd.get('state_abbr') as string,
      phone: fd.get('phone') as string,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Update the address details.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogBody>
            <FieldGroup>
              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel htmlFor="addr-fn">First Name</FieldLabel>
                  <Input
                    id="addr-fn"
                    name="first_name"
                    defaultValue={address?.first_name ?? ''}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="addr-ln">Last Name</FieldLabel>
                  <Input
                    id="addr-ln"
                    name="last_name"
                    defaultValue={address?.last_name ?? ''}
                  />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="addr-a1">Address</FieldLabel>
                <Input
                  id="addr-a1"
                  name="address1"
                  defaultValue={address?.address1 ?? ''}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="addr-a2">Apartment, suite, etc.</FieldLabel>
                <Input
                  id="addr-a2"
                  name="address2"
                  defaultValue={address?.address2 ?? ''}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel htmlFor="addr-city">City</FieldLabel>
                  <Input
                    id="addr-city"
                    name="city"
                    defaultValue={address?.city ?? ''}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="addr-zip">Postal Code</FieldLabel>
                  <Input
                    id="addr-zip"
                    name="postal_code"
                    defaultValue={address?.postal_code ?? ''}
                  />
                </Field>
              </div>
              <Field>
                <FieldLabel>Country</FieldLabel>
                <Select
                  name="country_iso"
                  defaultValue={address?.country_iso ?? ''}
                  onValueChange={setSelectedCountryIso}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.iso} value={country.iso}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="addr-state">State / Province</FieldLabel>
                {statesRequired && states.length > 0 ? (
                  <Select
                    name="state_abbr"
                    defaultValue={address?.state_abbr ?? ''}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {states.map((state) => (
                        <SelectItem key={state.abbr} value={state.abbr}>
                          {state.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="addr-state"
                    name="state_abbr"
                    defaultValue={address?.state_abbr ?? address?.state_name ?? ''}
                  />
                )}
              </Field>
              <Field>
                <FieldLabel htmlFor="addr-phone">Phone</FieldLabel>
                <Input
                  id="addr-phone"
                  name="phone"
                  defaultValue={address?.phone ?? ''}
                />
              </Field>
            </FieldGroup>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
