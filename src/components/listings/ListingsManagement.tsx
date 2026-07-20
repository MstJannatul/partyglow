import React, { useState } from 'react'
import { Edit, MoreVertical, Plus, Power, Trash2 } from 'lucide-react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  useDeleteListing,
  useUpdateListing,
  useVendorListings
} from '@/hooks/useListings'

import { CreateListingModal } from './CreateListingModal'
import { EditListingModal } from './EditListingModal'
import { VendorListingCard } from './VendorListingCard'

export const ListingsManagement: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedListing, setSelectedListing] = useState<any>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const { data: listings, isLoading, error } = useVendorListings()
  const updateListing = useUpdateListing()
  const deleteListing = useDeleteListing()

  const handleToggleActive = async (
    listingId: string,
    currentStatus: boolean
  ) => {
    setActionLoading(listingId)
    try {
      await updateListing.mutateAsync({
        id: listingId,
        updates: { is_active: !currentStatus }
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleEditListing = (listing: any) => {
    setSelectedListing(listing)
    setIsEditModalOpen(true)
  }

  const handleDeleteListing = (listing: any) => {
    setSelectedListing(listing)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (selectedListing) {
      setActionLoading(selectedListing.id)
      try {
        await deleteListing.mutateAsync(selectedListing.id)
        setIsDeleteDialogOpen(false)
        setSelectedListing(null)
      } finally {
        setActionLoading(null)
      }
    }
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Your Listings</h2>
            <p className="text-muted-foreground">
              Manage your services, equipment, and packages
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="py-12 text-center">
              <p className="mb-2 text-lg font-medium text-destructive">
                Failed to load listings
              </p>
              <p className="text-muted-foreground">
                There was an error loading your listings. Please try refreshing
                the page.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Your Listings</h2>
          <p className="text-muted-foreground">
            Manage your services, equipment, and packages
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
          <Plus className="size-4" />
          Create New Listing
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="mb-4 h-48 rounded-lg bg-muted"></div>
                <div className="mb-2 h-4 rounded bg-muted"></div>
                <div className="h-4 w-3/4 rounded bg-muted"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : listings && listings.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <div key={listing.id} className="relative">
              <div className="absolute right-2 top-2 z-20">
                <div className="flex items-center gap-2">
                  <Badge variant={listing.is_active ? 'default' : 'secondary'}>
                    {listing.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="size-8 bg-background/80 p-0 backdrop-blur-sm"
                        disabled={actionLoading === listing.id}
                      >
                        <MoreVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleEditListing(listing)}
                      >
                        <Edit className="mr-2 size-4" />
                        Edit Listing
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          handleToggleActive(listing.id, listing.is_active)
                        }
                        disabled={actionLoading === listing.id}
                      >
                        {listing.is_active ? (
                          <>
                            <Power className="mr-2 size-4" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <Power className="mr-2 size-4" />
                            Activate
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDeleteListing(listing)}
                        disabled={actionLoading === listing.id}
                      >
                        <Trash2 className="mr-2 size-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <VendorListingCard listing={listing} />
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6">
            <div className="py-12 text-center">
              <Plus className="mx-auto mb-4 size-12 text-muted-foreground" />
              <p className="mb-2 text-lg font-medium">
                You haven't created any listings yet.
              </p>
              <p className="mb-4 text-muted-foreground">
                Start by creating your first listing to showcase your services
                or equipment.
              </p>
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="gap-2"
              >
                <Plus className="size-4" />
                Create your first listing
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <CreateListingModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <EditListingModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        listing={selectedListing}
      />

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Listing</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedListing?.title}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
