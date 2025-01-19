-- CreateTable
CREATE TABLE "Booking" (
    "id" BIGSERIAL NOT NULL,
    "experimentId" BIGINT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES "Experiments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
