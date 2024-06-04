'use client'

import { FC, useEffect, useState } from 'react'

import { ContractIds } from '@/deployments/deployments'
import { zodResolver } from '@hookform/resolvers/zod'
// import GreeterContract from '@inkathon/contracts/typed-contracts/contracts/greeter'
import {
  contractQuery,
  decodeOutput,
  useInkathon,
  useRegisteredContract,
} from '@scio-labs/use-inkathon'
import { SubmitHandler, useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import * as z from 'zod'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Form, FormControl, FormItem, FormLabel } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { contractTxWithToast } from '@/utils/contract-tx-with-toast'

const formSchema = z.object({
  newMessage: z.string().min(1).max(90),
})

export const GreeterContractInteractions: FC = () => {
  const { api, activeAccount, activeSigner } = useInkathon()
  const { contract, address: contractAddress } = useRegisteredContract(ContractIds.GuessSecret)
  console.log(useRegisteredContract(ContractIds.Greeter))

  // const { typedContract } = useRegisteredTypedContract(ContractIds.Greeter, GreeterContract)
  // const [greeterMessage, setGreeterMessage] = useState<string>()
  const [fetchIsLoading, setFetchIsLoading] = useState<boolean>()
  const [guesses, setGuesses] = useState<Array<Array<string>>>()
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  })

  const { register, reset, handleSubmit } = form

  // Fetch Greeting
  const getchGuesses = async () => {

    if (!contract || !api) return

    setFetchIsLoading(true)
    try {
      const result = await contractQuery(api, '', contract, 'guesses')
      console.log("result", result);
      const { output, isError, decodedOutput } = decodeOutput(result, contract, 'guesses')
      // console.log("🚀 ~ getchGuesses ~ decodedOutput:", decodedOutput)
      // console.log("🚀 ~ getchGuesses ~ isError:", isError)
      // console.log("🚀 ~ getchGuesses ~ output:", output)
      
      if (isError) throw new Error(decodedOutput)
      setGuesses(output)
      // setGreeterMessage(output)

      // NOTE: Currently disabled until `typechain-polkadot` dependencies are upted to support ink! v5
      // Alternatively: Fetch it with typed contract instance
      // const typedResult = await typedContract.query.greet()
      // console.log('Result from typed contract: ', typedResult.value)
    } catch (e) {
      console.error(e)  
      toast.error('Error while fetching greeting. Try again…')
      setGreeterMessage(undefined)
    } finally {
      setFetchIsLoading(false)
    }
  }
  useEffect(() => {
    getchGuesses()
  }, [contract])

  // Update Greeting
  const updateGreeting: SubmitHandler<z.infer<typeof formSchema>> = async ({ newMessage }) => {
    if (!activeAccount || !contract || !activeSigner || !api) {
      toast.error('Wallet not connected. Try again…')
      return
    }

    try {
      await contractTxWithToast(api, activeAccount.address, contract, 'setMessage', {}, [
        newMessage,
      ])
      reset()
    } catch (e) {
      console.error(e)
    } finally {
      getchGuesses()
    }
  }

  if (!api) return null

  return (
    <>
      <div className="flex max-w-[22rem] grow flex-col gap-4">
        <h2 className="text-center font-mono text-gray-400">Guess Secret Smart Contrct</h2>

        <Form {...form}>
          
          <Card>
            <CardContent className="pt-6">
              <FormItem>
                <FormLabel className="text-base">Guesses</FormLabel>
                <FormControl>
                  {guesses ? (
                    <table>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Guess</th>
                        </tr>
                      </thead>
                      <tbody>
                        {guesses.map((guess, index) => (
                          <tr key={index}>
                            <td>{guess[1]}</td>
                            <td className="pl-8">{guess[2]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <Input
                      placeholder={fetchIsLoading || !contract ? 'Loading…' : ''}
                      disabled={true}
                    />
                  )}
                </FormControl>
              </FormItem>
            </CardContent>
          </Card>

        
          <Card>
            <CardContent className="pt-6">
              <form
                onSubmit={handleSubmit(updateGreeting)}
                className="flex flex-col justify-end gap-2"
              >
                <FormItem>
                  <FormLabel className="text-base">Guess your number!</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <Input
                        type="number" // Set input type to number
                        disabled={form.formState.isSubmitting}
                        {...register('newMessage', { valueAsNumber: true, setValueAs: (value: string) => parseInt(value) })}
                      />
                      <Button
                        type="submit"
                        className="bg-primary font-bold"
                        disabled={fetchIsLoading || form.formState.isSubmitting}
                        isLoading={form.formState.isSubmitting}
                      >
                        Submit
                      </Button>
                    </div>  
                  </FormControl>
                </FormItem>
              </form>
            </CardContent>
          </Card>
        </Form>

        {/* Contract Address */}
        <p className="text-center font-mono text-xs text-gray-600">
          {contract ? contractAddress : 'Loading…'}
        </p>
      </div>
    </>
  )
}
