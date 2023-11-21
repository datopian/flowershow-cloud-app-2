import { faker } from "@faker-js/faker"

export const randomSlug = (wordsCount = 3) => faker.lorem.words(wordsCount).replace(/\s/g, "-")
