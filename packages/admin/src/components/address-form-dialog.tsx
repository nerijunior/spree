import type { Address } from '@spree/admin-sdk'
import { type FormEvent, useCallback, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
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
  const [selectedStateAbbr, setSelectedStateAbbr] = useState<string>(
    address?.state_abbr ?? '',
  )

  const countryData = useMemo(
    () => countries.find((c) => c.iso === selectedCountryIso),
    [countries, selectedCountryIso],
  )

  const statesRequired = countryData?.states_required ?? false
  const states: Array<{ abbr: string; name: string }> = (countryData as any)?.states ?? []

  // Map ISO → name for the combobox display
  const countryNameByIso = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of countries) map.set(c.iso, c.name)
    return map
  }, [countries])

  const stateNameByAbbr = useMemo(() => {
    const map = new Map<string, string>()
    for (const s of states) map.set(s.abbr, s.name)
    return map
  }, [states])

  const handleCountryChange = useCallback((iso: string) => {
    setSelectedCountryIso(iso)
    setSelectedStateAbbr('')
  }, [])

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
      country_iso: selectedCountryIso,
      state_abbr: statesRequired ? selectedStateAbbr : (fd.get('state_abbr') as string),
      phone: fd.get('phone') as string,
    })
  }

  // Prevent Enter in combobox inputs from submitting the form
  function handleKeyDown(e: React.KeyboardEvent) {
    const target = e.target as HTMLElement
    if (e.key === 'Enter' && (target.getAttribute('role') === 'combobox' || target.closest('[data-slot="combobox-content"]'))) {
      e.preventDefault()
    }
  }

  return (
    <Sheet open={open} onOpenChange={(o) => onOpenChange(o as boolean)}>
      <SheetContent side="right">
        <SheetHeader>
          <div>
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription>Update the address details.</SheetDescription>
          </div>
        </SheetHeader>
        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4">
            <FieldGroup>
              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel htmlFor="addr-fn">First name</FieldLabel>
                  <Input id="addr-fn" name="first_name" defaultValue={address?.first_name ?? ''} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="addr-ln">Last name</FieldLabel>
                  <Input id="addr-ln" name="last_name" defaultValue={address?.last_name ?? ''} />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="addr-a1">Address</FieldLabel>
                <Input id="addr-a1" name="address1" defaultValue={address?.address1 ?? ''} />
              </Field>
              <Field>
                <FieldLabel htmlFor="addr-a2">Apartment, suite, etc.</FieldLabel>
                <Input id="addr-a2" name="address2" defaultValue={address?.address2 ?? ''} />
              </Field>
              <Field>
                <FieldLabel>Country</FieldLabel>
                <Combobox
                  value={selectedCountryIso}
                  onValueChange={(v) => handleCountryChange(v as string)}
                  itemToStringLabel={(iso) => countryNameByIso.get(iso as string) ?? (iso as string)}
                >
                  <ComboboxInput placeholder="Search countries..." />
                  <ComboboxContent>
                    <ComboboxList>
                      {countries.map((c) => (
                        <ComboboxItem key={c.iso} value={c.iso}>
                          {c.name}
                        </ComboboxItem>
                      ))}
                      <ComboboxEmpty>No countries found</ComboboxEmpty>
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel htmlFor="addr-city">City</FieldLabel>
                  <Input id="addr-city" name="city" defaultValue={address?.city ?? ''} />
                </Field>
                <Field>
                  <FieldLabel>State / Province</FieldLabel>
                  {statesRequired && states.length > 0 ? (
                    <Combobox
                      key={selectedCountryIso}
                      value={selectedStateAbbr}
                      onValueChange={(v) => setSelectedStateAbbr(v as string)}
                      itemToStringLabel={(abbr) => stateNameByAbbr.get(abbr as string) ?? (abbr as string)}
                    >
                      <ComboboxInput placeholder="Search states..." />
                      <ComboboxContent>
                        <ComboboxList>
                          {states.map((s) => (
                            <ComboboxItem key={s.abbr} value={s.abbr}>
                              {s.name}
                            </ComboboxItem>
                          ))}
                          <ComboboxEmpty>No states found</ComboboxEmpty>
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                  ) : (
                    <Input
                      id="addr-state"
                      name="state_abbr"
                      defaultValue={address?.state_abbr ?? ''}
                    />
                  )}
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="addr-zip">Postal code</FieldLabel>
                <Input id="addr-zip" name="postal_code" defaultValue={address?.postal_code ?? ''} />
              </Field>
              <Field>
                <FieldLabel htmlFor="addr-phone">Phone</FieldLabel>
                <Input id="addr-phone" name="phone" defaultValue={address?.phone ?? ''} />
              </Field>
            </FieldGroup>
          </div>
          <SheetFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : 'Save'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
