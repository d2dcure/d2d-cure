import prismaUsers from "../../../prismaUsersClient"

export default async function handler(req:any, res:any) {
  try {
    const institutions = await prismaUsers.institutions.findMany({
      select: {
        id: true,
        fullname: true,
        abbr: true,
        state: true,
        country_code: true,
        url: true,
      },
    })
    res.status(200).json(institutions)
  } catch (error) {
    console.error('Request error', error)
    res.status(500).json({ error: 'Error fetching institutions' })
  }
}