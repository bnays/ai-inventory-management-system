'use client';

import React from 'react';
import { 
  Box, Card, CardHeader, Divider, List, ListItem, 
  ListItemAvatar, ListItemText, Typography, Stack, Avatar 
} from '@mui/material';
import { Package, Warning, CheckCircle, Clock } from '@phosphor-icons/react';

export function LatestProducts({ products, sx }: { products: any[], sx?: any }) {
  return (
    <Card sx={{ ...sx, borderRadius: 5, border: '1px solid #eaecf0', boxShadow: 'none' }}>
      <CardHeader 
        title={<Typography variant="h6" fontWeight="800">New Inventory</Typography>}
        subheader="Latest additions to the Warehouse"
      />
      <Divider />
      <List>
        {products.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">No recent stock additions found.</Typography>
            </Box>
        ) : (
            products.map((product, index) => {
            // Use fallback values if properties are missing
            const onHand = Number(product.quantity_on_hand) || 0;
            const reorder = Number(product.reorder_level) || 0;
            const isLowStock = onHand <= reorder;
            const isOutOfStock = onHand <= 0;

            return (
                <ListItem divider={index < products.length - 1} key={product.id || index}>
                <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'neutral.100', borderRadius: 2 }}>
                    <Package size={24} weight="duotone" color="#475467" />
                    </Avatar>
                </ListItemAvatar>
                <ListItemText
                    primary={<Typography variant="body2" fontWeight="700">{product.name || 'Unknown Item'}</Typography>}
                    secondary={`SKU: ${product.sku || 'N/A'}`}
                />
                <Stack alignItems="flex-end" spacing={0.5}>
                    <Typography variant="body2" fontWeight="800">
                    {onHand} <Typography variant="caption" sx={{ fontWeight: 600 }}>Units</Typography>
                    </Typography>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                    {isOutOfStock ? (
                        <Warning size={14} weight="fill" color="#d32f2f" />
                    ) : isLowStock ? (
                        <Clock size={14} weight="fill" color="#ed6c02" />
                    ) : (
                        <CheckCircle size={14} weight="fill" color="#2e7d32" />
                    )}
                    <Typography 
                        variant="caption" 
                        fontWeight="700"
                        sx={{ color: isOutOfStock ? 'error.main' : isLowStock ? 'warning.main' : 'success.main' }}
                    >
                        {isOutOfStock ? 'OUT' : isLowStock ? 'LOW' : 'STABLE'}
                    </Typography>
                    </Stack>
                </Stack>
                </ListItem>
            );
            })
        )}
        </List>
    </Card>
  );
}