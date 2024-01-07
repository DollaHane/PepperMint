import { db } from "@/src/server/db"
import { listingsProperty, notifications } from "@/src/server/db/schema"
import { getAuthSession } from "@/src/lib/auth/auth-options"
import { validateProperty } from "@/src/lib/validators/validateProperty"
import { nanoid } from "nanoid"
import { z } from "zod"

export async function POST(req: Request) {
  try {
    const session = await getAuthSession()

    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 })
    }

    const body = await req.json()

    const authorId = JSON.stringify(session?.user.id)

    const generateListingId = nanoid()
    const listingId = JSON.stringify(generateListingId)

    const generateNotificationId = nanoid()
    const notificationId = JSON.stringify(generateNotificationId)

    const currentDate: Date = new Date()
    const expirationDate: Date = new Date(
      currentDate.getTime() + 30 * 24 * 60 * 60 * 1000
    )
    const purgeDate: Date = new Date(
      currentDate.getTime() + 60 * 24 * 60 * 60 * 1000
    )

    const availabilityStart = new Date(body.availableStart)
    const availabilityEnd = new Date(body.availableEnd)

    const {
      category,
      price,
      title,
      description,
      bedroom,
      bathroom,
      garage,
      parkingSpace,
      internet,
      petFriendly,
      images,
      location,
    } = validateProperty.parse(body)
    console.log(
      "data:",
      category,
      price,
      title,
      description,
      bedroom,
      bathroom,
      garage,
      parkingSpace,
      internet,
      petFriendly,
      images,
      location
    )

    const post = await db.insert(listingsProperty).values({
      id: listingId,
      authorId: authorId,
      createdAt: currentDate,
      updatedAt: currentDate,
      expirationDate: expirationDate,
      purgeDate: purgeDate,
      category: category,
      price: price,
      title: title,
      description: description,
      bedroom: bedroom,
      bathroom: bathroom,
      garage: garage,
      parkingSpace: parkingSpace,
      internet: internet,
      petFriendly: petFriendly,
      images: images,
      location: location,
      availableStart: availabilityStart,
      availableEnd: availabilityEnd,
      isAvailable: true,
    })

    const notification = await db.insert(notifications).values({
      id: notificationId,
      userId: authorId,
      adId: listingId,
      createdAt: currentDate,
      title: `Property Listing ${title} is live!`,
      description: "Congratulations, your listing is live!",
      body: `Thank you for choosing PepperMint to market your property. Your ad has been published to the our marketplace and we will be keeping you posted any new developements. Head over to "My Ads" to view or make any changes to your listing.`,
      isRead: false,
    })


    return new Response(JSON.stringify(post), { status: 200 })
  } catch (error) {
    console.error("error:", error)
    if (error instanceof z.ZodError) {
      return new Response(error.message, { status: 400 })
    }
    return new Response(
      "Could not create a post at this time. Please try later",
      { status: 500 }
    )
  }
}
