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
  myGuess: z.string().min(1).max(90),
  myName: z.string(),
})

export const GreeterContractInteractions: FC = () => {
  const { api, activeAccount, activeSigner } = useInkathon()
  const { contract, address: contractAddress } = useRegisteredContract(ContractIds.GuessSecret)
  console.log(useRegisteredContract(ContractIds.Greeter))

  // const { typedContract } = useRegisteredTypedContract(ContractIds.Greeter, GreeterContract)
  // const [greeterMessage, setGreeterMessage] = useState<string>()
  const [fetchIsLoading, setFetchIsLoading] = useState<boolean>()
  const [guesses, setGuesses] = useState<Array<Array<string>>>()
  const [winner, setWinner] = useState<string>()
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
      setGuesses(undefined)
    } finally {
      setFetchIsLoading(false)
    }
  }




  // Fetch Winner
  const getchWinner = async () => {

    if (!contract || !api) return

    setFetchIsLoading(true)
    try {
      const result = await contractQuery(api, '', contract, 'winner')
      console.log("result", result);
      const { output, isError, decodedOutput } = decodeOutput(result, contract, 'winner')
      
      if (isError) throw new Error(decodedOutput)
        setWinner(output)

    } catch (e) {
      console.error(e)  
      toast.error('Error while fetching greeting. Try again…')
      setWinner(undefined)
    } finally {
      setFetchIsLoading(false)
    }
  }

  useEffect(() => {
    getchGuesses()
    getchWinner()
  }, [contract])

  // Update Greeting
  const submitGuess: SubmitHandler<z.infer<typeof formSchema>> = async ({ myName, myGuess }) => {
    console.log("🚀 ~ constsubmitGuess:SubmitHandler<z.infer<typeofformSchema>>= ~ myName:", myName)
    console.log("🚀 ~ constsubmitGuess:SubmitHandler<z.infer<typeofformSchema>>= ~ myGuess:", myGuess)
    
    if (!activeAccount || !contract || !activeSigner || !api) {
      toast.error('Wallet not connected. Try again…')
      return
    }
    if (parseInt(myGuess) < 0 || parseInt(myGuess) > 90 ) {
      toast.error('Number must be between 0 and 90…')
      return
    }

    try {
      await contractTxWithToast(api, activeAccount.address, contract, 'guess', {}, [
        myName,
        parseInt(myGuess),
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

          {/* Insert here card for new value called winner */}
          <Card>
            <CardContent className="pt-6">
              <FormItem>
                <FormLabel className="text-base">Winner</FormLabel>
                <FormControl>
                  {winner ? (
                    <p>{winner} is the winner!</p>
                  ) : (
                    <p>No winner yet.</p>
                  )}
                </FormControl>
              </FormItem>
            </CardContent>
          </Card>
          {!winner && 
          
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit(submitGuess)} className="flex flex-col justify-end gap-2">
                <FormItem>
                  <FormLabel className="text-base">Guess your number</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <Input
                        {...register('myName', {
                          required: true, // Ensure a value is entered
                        })}
                        disabled={form.formState.isSubmitting}
                        type="text"
                        placeholder="Name"
                      />
                      <Input
                        {...register('myGuess', {
                          required: true, // Ensure a value is entered
                          validate: (value) => {
                            if (!/^[0-9]{1,2}$/.test(value)) {
                              return 'Please enter a number between 0 and 90.';
                            }

                            const numValue = parseInt(value, 10);
                            if (numValue < 0 || numValue > 90) {
                              return 'Number must be between 0 and 90.';
                            }
                          },
                        })}
                        disabled={form.formState.isSubmitting}
                        placeholder='your guess'
                        type="number" // Set the input type to "number" for browser validation (optional)
                      />
                      <Button
                        type="submit"
                        className="bg-primary font-bold"
                        disabled={form.formState.isSubmitting || fetchIsLoading}
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
          }
        </Form>

        {/* Contract Address */}
        <p className="text-center font-mono text-xs text-gray-600">
          {contract ? contractAddress : 'Loading…'}
        </p>
      </div>
    </>
  )
}
