// Dependencies
import jwt from 'jsonwebtoken'
import { AuthenticationError } from 'apollo-server'

// Utils
import { encrypt, setBase64, isPasswordMatch } from 'fogg-utils'

// Interface
import { iUser, iModels, iAuthPayload } from '../interfaces'

// Configuration
import { $security } from '../../config'

export const createToken = async (user: iUser): Promise<string[]> => {
  const { id, username, password, email, privilege, active } = user
  const token = setBase64(`${encrypt($security.secretKey)}${password}`)
  const userData = {
    id,
    username,
    email,
    privilege,
    active,
    token
  }

  const createTk = jwt.sign(
    { data: setBase64(userData) },
    $security.secretKey,
    { expiresIn: $security.expiresIn }
  )

  return Promise.all([createTk])
}

export const getUserBy = async (
  where: any,
  models: iModels
): Promise<iUser> => {
  const user = await models.User.findOne({
    where,
    raw: true
  })

  return user
}

export const doLogin = async (
  email: string,
  password: string,
  models: iModels
): Promise<iAuthPayload> => {
  const user = await getUserBy({ email }, models)
  console.log('USER===', user)
  if (!user) {
    throw new AuthenticationError('Invalid Login')
  }

  const passwordMatch = isPasswordMatch(encrypt(password), user.password)
  const isActive = user.active
  console.log('PASSWORD===', passwordMatch)
  console.log('IS ACTIVE===', isActive)
  if (!passwordMatch) {
    throw new AuthenticationError('Invalid Login')
  }

  if (!isActive) {
    throw new AuthenticationError('Your account is not activated yet')
  }

  const [token] = await createToken(user)

  return {
    token
  }
}
