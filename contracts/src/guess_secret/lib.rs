#![cfg_attr(not(feature = "std"), no_std, no_main)]
#[ink::contract]

mod guess_secret {
    use core::panic;

    use ink::prelude::string::String;
    use sp_core::*;
    use ink::prelude::{vec::Vec};
    const HASH_SIZE: usize = 16;

    #[ink(storage)]
    pub struct GuessSecret {
        secret_hash: [u8; HASH_SIZE],
        guesses: Vec<(AccountId, String, u8)>,
        winner: Option<String>,
        participants: Vec<AccountId>,
    }
    // pub struct Guess {
    //     from: Option<AccountId>,
    //     name: String,
    //     guesses_value: u8,
    // }
    // Function to hash a number with a salt
    fn hash_with_salt(number: u8, salt: String) -> [u8; 16] {
        // Convert the number to a byte array
        let number_bytes = number.to_le_bytes();

        // Convert the salt string to a byte array
        let salt_bytes = salt.as_bytes();

        // Combine the number bytes and salt bytes
        let mut combined_bytes = Vec::new();
        combined_bytes.extend_from_slice(&number_bytes);
        combined_bytes.extend_from_slice(salt_bytes);

        // Compute the hash of the combined byte array
        blake2_128(&combined_bytes)
    }

    impl GuessSecret {
        /// Creates a new guess_secret contract initialized with the given value.
        #[ink(constructor)]
        pub fn new(hash: [u8; HASH_SIZE]) -> Self {
            Self {
                secret_hash: hash,
                guesses: Vec::new(),
                winner: None,
                participants: Vec::new(),
            }
        }

        // /// Creates a new guess_secret contract initialized to 'Hello ink!'.
        // #[ink(constructor)]
        // pub fn default(hash: [u8; HASH_SIZE]) -> Self {
        //     // let default_message = String::from("Hello ink!");
        //     Self::new(hash)
        // }

        /// Returns the guesses
        #[ink(message)]
        pub fn guesses(&self) -> Vec<(AccountId, String, u8)> {
            self.guesses.clone()
        }

        /// Returns the guesses
        #[ink(message)]
        pub fn winner(&self) -> Option<String> {
            self.winner.clone()
        }

        /// Sets `message` to the given value.
        #[ink(message)]
        pub fn select_winner(&mut self, secret: u8, salt: String) {
            for guess in &self.guesses {
                let (_, name, num) = guess;
                if hash_with_salt(*num, salt.clone()) == self.secret_hash
                    && hash_with_salt(secret, salt.clone()) == self.secret_hash
                {
                    self.winner = Some(name.clone());
                }
            }
        }

        /// Sets `message` to the given value.
        #[ink(message)]
        pub fn guess(&mut self, name: String, guessed_value: u8) {
            if self.winner.is_none() {
                let from = self.env().caller();
                if self.participants.contains(&from) {
                    panic!("you cannot play twice")
                } else {
                    self.participants.extend_from_slice(&[from]);
                    self.guesses
                        .extend_from_slice(&[(from, name, guessed_value)]);
                }
            } else {
                panic!("we have already a winner");
            }
        }
    }

    #[cfg(test)]
    mod tests {
        use super::*;
        use ink::env::test;

        // Function to hash a number with a salt
        fn hash_with_salt(number: u8, salt: String) -> [u8; 16] {
            // Convert the number to a byte array
            let number_bytes = number.to_le_bytes();

            // Convert the salt string to a byte array
            let salt_bytes = salt.as_bytes();

            // Combine the number bytes and salt bytes
            let mut combined_bytes = Vec::new();
            combined_bytes.extend_from_slice(&number_bytes);
            combined_bytes.extend_from_slice(salt_bytes);

            // Compute the hash of the combined byte array
            blake2_128(&combined_bytes)
        }

        fn set_caller(sender: AccountId) {
            ink::env::test::set_caller::<Environment>(sender);
        }

        fn default_accounts() -> test::DefaultAccounts<Environment> {
            ink::env::test::default_accounts::<Environment>()
        }

        #[ink::test]
        fn works() {
            // let secret: u8 = 50;
            // let bytes_8 = secret.to_le_bytes(); // or use to_be_bytes() for big-endian
            // dbg!(bytes_8);
            // let mut bytes_16: [u8; 16] = [0; 16];

            // // Copy the 8 bytes into the first 8 positions of the 16-byte array
            // bytes_16[..8].copy_from_slice(&bytes_8);
            // dbg!(bytes_16);

            // Convert the number to a byte array
            let number: u8 = 200;
            let my_salt = String::from("mysalt");
            let hash: [u8; 16] = hash_with_salt(number, my_salt);
            dbg!(hash);
            let mut guess_secret = GuessSecret::new(hash);

            assert_eq!(guess_secret.winner(), None);
            assert_eq!(guess_secret.guesses(), Vec::new());

            // guess not
            let accounts = default_accounts();
            set_caller(accounts.alice);
            guess_secret.guess(String::from("myname"), 8);
            assert_eq!(guess_secret.winner(), None);
            let mut expected_vec: Vec<(ink::primitives::AccountId, String, u8)> = Vec::new();
            expected_vec.extend_from_slice(&[(accounts.alice, String::from("myname"), 8)]);
            assert_eq!(guess_secret.guesses()[0], expected_vec[0]);

            set_caller(accounts.bob);
            guess_secret.guess(String::from("Bob"), 200);
            assert_eq!(guess_secret.winner(), None);
            let mut expected_vec: Vec<(ink::primitives::AccountId, String, u8)> = Vec::new();
            expected_vec.extend_from_slice(&[(accounts.alice, String::from("myname"), 8)]);
            expected_vec.extend_from_slice(&[(accounts.bob, String::from("Bob"), 200)]);
            assert_eq!(guess_secret.guesses()[0], expected_vec[0]);
            assert_eq!(guess_secret.guesses()[1], expected_vec[1]);

            guess_secret.select_winner(200, String::from("mysalt"));

            assert_eq!(guess_secret.winner(), Some(String::from("Bob")));
        }

        #[ink::test]
        #[should_panic]
        fn cannot_twice() {
            // let secret: u8 = 50;
            // let bytes_8 = secret.to_le_bytes(); // or use to_be_bytes() for big-endian
            // dbg!(bytes_8);
            // let mut bytes_16: [u8; 16] = [0; 16];

            // // Copy the 8 bytes into the first 8 positions of the 16-byte array
            // bytes_16[..8].copy_from_slice(&bytes_8);
            // dbg!(bytes_16);

            // Convert the number to a byte array
            let number: u8 = 200;
            let my_salt = String::from("mysalt");
            let hash: [u8; 16] = hash_with_salt(number, my_salt);
            let mut guess_secret = GuessSecret::new(hash);

            assert_eq!(guess_secret.winner(), None);
            assert_eq!(guess_secret.guesses(), Vec::new());

            // guess not
            let accounts = default_accounts();
            set_caller(accounts.alice);
            guess_secret.guess(String::from("myname"), 8);
            guess_secret.guess(String::from("myname"), 10);
        }
    }
}
